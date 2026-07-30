import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { AppDispatch } from '../redux/store';
import { dismissActivity, trackActivity } from '../redux/slices/activitySlice';
import { TrackedActivity } from '../services/storage/activityStorage';

type TrackOptions = Omit<TrackedActivity, 'timestamp'> & {
    /**
     * If true, the activity is cleared when the component unmounts.
     * Set to true on success/completion screens.
     * Default: false (activity persists for resume).
     */
    clearOnUnmount?: boolean;
};

/**
 * Call this hook inside a screen to register it as a resumable activity.
 *
 * @example
 * useTrackActivity({
 *   id: `doctor-${doctorId}`,
 *   title: `Booking Dr. ${doctorName}`,
 *   subtitle: 'Continue from where you left',
 *   icon: 'stethoscope',
 *   stack: 'DoctorStack',
 *   screen: 'DoctorDetail',
 *   params: { doctorId },
 *   progress: 0.4,
 * });
 */
export function useTrackActivity(options: TrackOptions) {
    const dispatch = useDispatch<AppDispatch>();
    const { clearOnUnmount = false, ...activity } = options;

    useEffect(() => {
        dispatch(trackActivity(activity));

        return () => {
            if (clearOnUnmount) {
                dispatch(dismissActivity());
            }
        };
        // We intentionally run once on mount (or when the key id changes)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activity.id]);
}
