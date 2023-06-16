import React, {Fragment, useEffect} from "react";

import Box from '@mui/material/Box';
import CssBaseline from '@mui/material/CssBaseline';
import Header from "../layout/Header";
import ChatBox from "../pages/ChatBox";
import {useParams} from 'react-router-dom';

const ChatRoom=(props)=>{

    const { roomId, userId,admin } = useParams();

    const chat={
        "roomId":roomId,
        "userId":userId,
        "admin":admin
    }

    return(
        <Fragment>
           { /** chat area with header, chat box */}
            <Box sx={{ display: 'flex', }}>
              <CssBaseline />
              {/**header  */}
              <Header chat={chat}/>
              {/**chat area etc.. */}
              <ChatBox chat={chat}/>
            </Box>
        </Fragment>  
    )
}



export default ChatRoom;