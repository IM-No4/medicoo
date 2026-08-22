package expo.modules.medicoostepcounter

import android.content.Context
import android.hardware.Sensor
import android.hardware.SensorEvent
import android.hardware.SensorEventListener
import android.hardware.SensorManager
import android.os.Handler
import android.os.Looper
import expo.modules.kotlin.Promise
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

// Reads Android's TYPE_STEP_COUNTER hardware sensor - a cumulative,
// since-last-boot step count maintained by the OS/sensor hub independent of
// whether any app is running, so this module deliberately does NOT run a
// persistent foreground service: callers (see
// nativeStepsSyncService.ts) sample this periodically and diff against a
// stored baseline, rather than keeping a listener alive continuously.
//
// Important: this stays registered for the FULL listen window and keeps
// the LAST value it receives, rather than resolving on the first event.
// On some sensor HALs (confirmed on a real Samsung device) the very first
// onSensorChanged delivered right after registerListener() is just a
// replay of a stale cached value, not a live recomputation - resolving on
// that first event silently returns the same frozen number forever,
// regardless of how many real steps happen. Staying registered a bit
// longer gives the sensor hub a chance to deliver a genuinely fresh value.
private const val LISTEN_WINDOW_MS = 3000L

class MedicooStepCounterModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("MedicooStepCounter")

    AsyncFunction("readRawStepCounter") { promise: Promise ->
      val context = appContext.reactContext
      if (context == null) {
        promise.resolve(null)
        return@AsyncFunction
      }

      val sensorManager = context.getSystemService(Context.SENSOR_SERVICE) as? SensorManager
      val sensor = sensorManager?.getDefaultSensor(Sensor.TYPE_STEP_COUNTER)
      if (sensorManager == null || sensor == null) {
        promise.resolve(null)
        return@AsyncFunction
      }

      var resolved = false
      var lastValue: Double? = null
      val handler = Handler(Looper.getMainLooper())
      lateinit var listener: SensorEventListener

      val finishRunnable = Runnable {
        if (!resolved) {
          resolved = true
          sensorManager.unregisterListener(listener)
          promise.resolve(lastValue)
        }
      }

      listener = object : SensorEventListener {
        override fun onSensorChanged(event: SensorEvent) {
          // Keep updating with whatever's most recent instead of
          // resolving immediately - the window closes on its own timer.
          lastValue = event.values[0].toDouble()
        }

        override fun onAccuracyChanged(sensor: Sensor?, accuracy: Int) {}
      }

      sensorManager.registerListener(listener, sensor, SensorManager.SENSOR_DELAY_FASTEST)
      handler.postDelayed(finishRunnable, LISTEN_WINDOW_MS)
    }
  }
}
