package expo.modules.medicoostepcounter

import android.app.AlarmManager
import android.app.PendingIntent
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.hardware.Sensor
import android.hardware.SensorEvent
import android.hardware.SensorEventListener
import android.hardware.SensorManager
import android.os.Handler
import android.os.Looper
import org.json.JSONArray
import org.json.JSONObject

// The step-counter sensor only reports a running total, so on its own it cannot say WHEN steps happened. These samples are what make the
// history screen's hourly / 3-hour bars honest: an alarm reads the sensor every SAMPLE_INTERVAL_MS (also while the app is closed) and stores
// (time, running total). The difference between two samples is the steps walked in exactly that interval, however long the app was asleep.
// No foreground service or notification is needed: the alarm wakes a receiver for a few seconds, reads the sensor, stores, and re-arms itself.
private const val PREFS = "medicoo_step_samples"
private const val KEY_SAMPLES = "samples"
private const val KEY_ENABLED = "enabled"
private const val MAX_SAMPLES = 800 // about 8 days at one every 15 minutes
private const val SAMPLE_INTERVAL_MS = 15L * 60L * 1000L
private const val SAMPLER_LISTEN_WINDOW_MS = 3000L
private const val ACTION_SAMPLE = "expo.modules.medicoostepcounter.SAMPLE"
private const val ALARM_REQUEST_CODE = 41017

object StepSampler {
  private val lock = Any()

  private fun prefs(context: Context) = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)

  fun isEnabled(context: Context): Boolean = prefs(context).getBoolean(KEY_ENABLED, false)

  fun setEnabled(context: Context, enabled: Boolean) {
    prefs(context).edit().putBoolean(KEY_ENABLED, enabled).apply()
    if (enabled) schedule(context) else cancel(context)
  }

  // Reads the sensor, staying registered for the whole window and keeping the LAST value (the first event can be a stale cached replay on some
  // sensor HALs, see MedicooStepCounterModule). Calls onDone(null) when the device has no step counter or nothing arrived.
  fun readCounter(context: Context, onDone: (Double?) -> Unit) {
    val sensorManager = context.getSystemService(Context.SENSOR_SERVICE) as? SensorManager
    val sensor = sensorManager?.getDefaultSensor(Sensor.TYPE_STEP_COUNTER)
    if (sensorManager == null || sensor == null) {
      onDone(null)
      return
    }
    var finished = false
    var last: Double? = null
    val handler = Handler(Looper.getMainLooper())
    lateinit var listener: SensorEventListener
    val finish = Runnable {
      if (!finished) {
        finished = true
        sensorManager.unregisterListener(listener)
        onDone(last)
      }
    }
    listener = object : SensorEventListener {
      override fun onSensorChanged(event: SensorEvent) {
        last = event.values[0].toDouble()
      }

      override fun onAccuracyChanged(sensor: Sensor?, accuracy: Int) {}
    }
    sensorManager.registerListener(listener, sensor, SensorManager.SENSOR_DELAY_FASTEST)
    handler.postDelayed(finish, SAMPLER_LISTEN_WINDOW_MS)
  }

  fun append(context: Context, timeMs: Long, counter: Double) {
    synchronized(lock) {
      val stored = JSONArray(prefs(context).getString(KEY_SAMPLES, "[]"))
      val kept = JSONArray()
      val from = maxOf(0, stored.length() - (MAX_SAMPLES - 1))
      for (i in from until stored.length()) kept.put(stored.getJSONObject(i))
      kept.put(JSONObject().put("t", timeMs).put("c", counter))
      prefs(context).edit().putString(KEY_SAMPLES, kept.toString()).apply()
    }
  }

  // [[time, counter], ...] oldest first
  fun all(context: Context): List<List<Double>> {
    synchronized(lock) {
      val stored = JSONArray(prefs(context).getString(KEY_SAMPLES, "[]"))
      return (0 until stored.length()).map {
        val o = stored.getJSONObject(it)
        listOf(o.getDouble("t"), o.getDouble("c"))
      }
    }
  }

  fun clearUpTo(context: Context, timeMs: Long) {
    synchronized(lock) {
      val stored = JSONArray(prefs(context).getString(KEY_SAMPLES, "[]"))
      val kept = JSONArray()
      for (i in 0 until stored.length()) {
        val o = stored.getJSONObject(i)
        if (o.getLong("t") > timeMs) kept.put(o)
      }
      prefs(context).edit().putString(KEY_SAMPLES, kept.toString()).apply()
    }
  }

  private fun pendingIntent(context: Context, create: Boolean): PendingIntent? {
    val intent = Intent(context, StepSampleReceiver::class.java).setAction(ACTION_SAMPLE)
    val flags = PendingIntent.FLAG_IMMUTABLE or (if (create) PendingIntent.FLAG_UPDATE_CURRENT else PendingIntent.FLAG_NO_CREATE)
    return PendingIntent.getBroadcast(context, ALARM_REQUEST_CODE, intent, flags)
  }

  fun isScheduled(context: Context): Boolean = pendingIntent(context, false) != null

  // Inexact on purpose: it needs no special "exact alarm" permission, and a few minutes either way does not matter for hourly bars.
  fun schedule(context: Context) {
    val alarms = context.getSystemService(Context.ALARM_SERVICE) as? AlarmManager ?: return
    val pending = pendingIntent(context, true) ?: return
    alarms.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, System.currentTimeMillis() + SAMPLE_INTERVAL_MS, pending)
  }

  fun cancel(context: Context) {
    val alarms = context.getSystemService(Context.ALARM_SERVICE) as? AlarmManager ?: return
    pendingIntent(context, false)?.let {
      alarms.cancel(it)
      it.cancel()
    }
  }
}

class StepSampleReceiver : BroadcastReceiver() {
  override fun onReceive(context: Context, intent: Intent) {
    if (!StepSampler.isEnabled(context)) return
    val pending = goAsync()
    // arm the next alarm first: even if the read below fails, sampling carries on
    StepSampler.schedule(context)
    StepSampler.readCounter(context) { value ->
      if (value != null) StepSampler.append(context, System.currentTimeMillis(), value)
      pending.finish()
    }
  }
}
