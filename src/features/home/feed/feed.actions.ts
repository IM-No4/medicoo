export type FeedActionType =
    | 'NAVIGATE'
    | 'OPEN_MODAL'
    | 'SHOW_TOAST'
    | 'OPEN_URL';

export interface BaseAction {
    type: FeedActionType;
}

export interface NavigateAction extends BaseAction {
    type: 'NAVIGATE';
    screen: string;
    params?: Record<string, any>;
    stack?: string; // Optional stack name (e.g., 'DoctorStack')
}

export interface OpenModalAction extends BaseAction {
    type: 'OPEN_MODAL';
    modalId: string;
    data?: any;
}

export interface ShowToastAction extends BaseAction {
    type: 'SHOW_TOAST';
    message: string;
    variant?: 'success' | 'error' | 'info';
}

export interface OpenUrlAction extends BaseAction {
    type: 'OPEN_URL';
    url: string;
}

export type FeedAction =
    | NavigateAction
    | OpenModalAction
    | ShowToastAction
    | OpenUrlAction;
