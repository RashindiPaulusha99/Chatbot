import {createSlice} from '@reduxjs/toolkit';

const notificationAction = createSlice({
    name: 'notification',
    initialState: {
        isNotify: null,
        name:null
    },
    reducers:{
        notify(state, action){
            state.isNotify = action.payload;
        }
    }
});

export const {notify} = notificationAction.actions;

export default notificationAction.reducer;