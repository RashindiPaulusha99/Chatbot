import React,{Fragment,useEffect,useState} from "react";

import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import Badge from '@mui/material/Badge';
import NotificationsIcon from '@mui/icons-material/Notifications';
import ChatServices from "../services/ChatServices";
import { useSelector, useDispatch } from 'react-redux';
import {notify} from '../redux/notification_action';

const Header=(props)=>{

    const userId=props.chat.userId;
    const roomId=props.chat.roomId;
    const admin=props.chat.admin;

    const dispatch = useDispatch();

    const [count, setCount]=useState(0);
    const countData = useSelector((state) => state.notification_action);

    useEffect(()=>{
        findNotifications()
    },[])

    const findNotifications = async()=>{
        const count = await ChatServices.fetchMessageCount(userId,roomId);
        if (count.status  === 200){
            if (count.data.data == 0){
                setCount(1)
            }else {

            }
        }
    }

    return(
     
        <Fragment>

          <AppBar position="fixed" style={{backgroundColor:'#F5F5F5', boxShadow:'none',height:65,zIndex:'auto'}}>
            <Toolbar>
            <Box sx={{ flexGrow: 1 }} />
              <Typography style={{position:'relative', left:0,right:0,top:5, bottom:0,margin:'auto',color:"#000000" ,fontWeight:700,fontSize:14,display:'flex', justifyContent:'center', fontFamily:'system-ui'}}>
                  Virtual Assistant
              </Typography>
              <Box sx={{ flexGrow: 1 }} />
                <Badge badgeContent={count} color="primary">
                    <NotificationsIcon color="action" />
                </Badge>
            </Toolbar>
          </AppBar>
         
        </Fragment>  
    )
}


export default Header;