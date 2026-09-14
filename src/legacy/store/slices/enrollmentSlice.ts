// src/store/enrollmentSlice.ts
import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface EnrollmentState {
  currentEnrollment: {
    _id: string;
    // Include other enrollment properties as needed
  } | null;
}

const initialState: EnrollmentState = {
  currentEnrollment: null,
};

const enrollmentSlice = createSlice({
  name: "enrollment",
  initialState,
  reducers: {
    setEnrollment(state, action: PayloadAction<any>) {
      state.currentEnrollment = action.payload;
    },
    clearEnrollment(state) {
      state.currentEnrollment = null;
    },
  },
});

export const { setEnrollment, clearEnrollment } = enrollmentSlice.actions;
export default enrollmentSlice.reducer;
