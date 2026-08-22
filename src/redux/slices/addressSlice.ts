import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export type Address = {
  id?: string;
  latitude: number;
  longitude: number;

  // display
  label?: string;
  fullAddress?: string;
  area?: string;
  city?: string;
  receiverName?: string;
  // Matches the backend CustomerAddress schema's field name - Mongoose
  // strict mode silently drops anything sent as receiverPhone instead,
  // which was why receiver numbers never actually persisted or displayed.
  receiverNumber?: string;
};

type AddressState = {
  selectedAddress: Address | null;
};

const initialState: AddressState = {
  selectedAddress: null,
};

const addressSlice = createSlice({
  name: 'address',
  initialState,
  reducers: {
    setSelectedAddress(
      state,
      action: PayloadAction<Address>
    ) {
      state.selectedAddress = action.payload;
    },
    clearSelectedAddress(state) {
      state.selectedAddress = null;
    },
  },
});

export const {
  setSelectedAddress,
  clearSelectedAddress,
} = addressSlice.actions;

export default addressSlice.reducer;
