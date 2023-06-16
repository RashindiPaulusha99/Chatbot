import React, { Fragment,useRef, useEffect,useState,useMemo,useCallback } from "react";

import ListItem from '@mui/material/ListItem';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import List from '@mui/material/List';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import AppBar from '@mui/material/AppBar';
import InputAdornment from '@mui/material/InputAdornment';
import Button from '@mui/material/Button';
import ListSubheader from '@mui/material/ListSubheader';
import Divider from '@mui/material/Divider';
import Backdrop from '@mui/material/Backdrop';

import SendIcon from '@mui/icons-material/Send';
import CloseIcon from '@mui/icons-material/Close';
import SchoolIcon from '@mui/icons-material/School';
import HelpIcon from '@mui/icons-material/Help';
import CallIcon from '@mui/icons-material/Call';
import DeleteOutlineOutlinedIcon from '@mui/icons-material/DeleteOutlineOutlined';

import { makeStyles } from "@material-ui/core/styles";
import { useTheme } from '@mui/material/styles';

import '../assets/Styles/Font.scss';
import "../assets/Styles/hideScrollbar.scss";
import '../assets/Styles/Message.scss';
import bot from '../assets/Images/chatbot-kiu.gif';
import botIcon from '../assets/Images/325d69082429a2aa9f840b24be4d6bcd-removebg-preview.png'
import ChatServices from "../services/ChatServices";

import { useSelector, useDispatch } from 'react-redux';
import {notify} from '../redux/notification_action';

  /**text field styles*/
  const useStyle = makeStyles((theme) => ({
    root: {
      "& .MuiOutlinedInput-root": {
        background: "#F9F9F9",
        borderColor: 'white',
        borderRadius:'6.25352px',
        zIndex:'2',
        fontFamily:'system-ui'
      },
      "& .MuiOutlinedInput-notchedOutline":{
        borderColor:'white'
      }
    }
  }));

  function loadScript(src, position, id) {
    if (!position) {
      return;
    }
  
    const script = document.createElement('script');
    script.setAttribute('async', '');
    script.setAttribute('id', id);
    script.src = src;
    position.appendChild(script);
  }

const ChatBox=(props)=>{

    const ref = useRef(null);
    const inputRef = useRef(null);
    const chatContainer = useRef(null);

    const dispatch = useDispatch();

    const [messages, setMessages] = useState([]);   
    const [open, setOpen] = React.useState(false);
    const [text, setText ] = useState('');
    const [visibleSendIcon, setVisibleSendIcon ] = useState(false);
    const [page, setPage] = useState(10);
    const [hasMore, setHasMore] = useState(true);
    const [isScrollTop, setIsScrollTop] = useState(false);
    const [maximumContent, setMaximumContent] = useState(false);
    const [deleteMessage, setDeleteMessage] = useState('');
    const [showDeleteIcon, setShowDeleteIcon] = useState(false);
    const [showDeleteAlert, setDeleteAlert] = useState(false);
    const [openBackdrop, setOpenBackdrop] = useState(false);
     
    const theme = useTheme();
    const style = useStyle();

    const userId=props.chat.userId;
    const roomId=props.chat.roomId;
    const admin=props.chat.admin;

    useEffect(()=>{
        fetchHistoryDetails();
    },[]);

    // when page load scroll bar should down
    useEffect(()=>{
      if(!isScrollTop){
        chatContainer.current.scrollTop = chatContainer.current.scrollHeight;  
      }
      
    },[messages])

    const currentDate = new Date().toISOString().slice(0, 10);
    const hours = new Date().getHours().toString().padStart(2, '0');
    const minutes = new Date().getMinutes().toString().padStart(2, '0');
    const seconds = new Date().getSeconds().toString().padStart(2, '0');
    const currentTime = `${hours}:${minutes}:${seconds}`;

    /**load chat history */
    const fetchHistoryDetails = async(e)=>{
        try {
              const response = await ChatServices.fetchHistory(userId,roomId);

              const count = await ChatServices.fetchMessageCount(userId,roomId);
              dispatch(notify({ data:count.data.data }));

              const botChat={
                  "id":0,
                  "user":"bot",
                  "message":"How can I help you today?".toString(),
                  "date":currentDate,
                  "time":currentTime
              }

              if  (response.status === 200){
                  const content = [...response.data.data];
                  setMessages(content);
                  setHasMore(content.length > 0);

                  if(response.data.data.length === count.data.data){
                    setMaximumContent(true);
                  }
              }
        } catch (error) {
            console.error(error);
        }
    }

    // handle scroll bar when paginate
    const handleScroll = (event) => {
      const chatContainer = event.target;
      if (chatContainer.scrollTop === 0 && hasMore) {
        
        if(!maximumContent){
          setPage(page + 10);
          setIsScrollTop(true);
          fetchHistoryDetails();
          chatContainer.scrollTop = 200;
          
        }else{
          chatContainer.scrollTop = 0;
        }
        
      }
    };

    /**send message to server */
    const handleSendMessages = async(event)=>{

        setIsScrollTop(false);
        var user = "user";

        if (admin == "false"){
            user = "user";
        }else {
            user = "admin";
        }

        const message={
            "roomId":roomId,
            "user":user,
            "prompt":text,
            "date":currentDate,
            "time":currentTime
        }

        console.log(message)

        const response = await ChatServices.sendMessage(message);

        for (let i = 0; i <response.data.response.length ; i++) {
            setMessages(prevMessages =>
                [...prevMessages, response.data.response[i]]
            )
        }

        const count = await ChatServices.fetchMessageCount(userId,roomId);

        if(response.status === 200){
          setText('');
          setVisibleSendIcon(false);
          dispatch(notify({ data:count.data.data }));
        }
    }

    // UTC time convert into SL time
    const handleTime=(time)=>{
      if(time > '12:01:00'){
        return time.substring(0, 5)+' PM';
      }else{
        return time+' AM';
      }  
    
    }

    /**--------------delete messages------------- */

    // delete message from server
    const handleDeleteMessages=async()=>{

      const message={
        "id":deleteMessage,
        "roomId":roomId,
        "userId":userId,
        "user":"user",
        "message":deleteMessage,
        "date":currentDate,
        "time":currentTime
      }

      const response =await ChatServices.deleteMessage(message);

      setMessages(messages.filter(deleteMessages => deleteMessages.id !== response.data.message));

      setShowDeleteIcon(false);
      setDeleteAlert(false);
      
    }

    //check whether message was delete
    const handleWhetherDeleteMessage=()=>{
      setDeleteAlert(true);
      handleToggle();
    }

    // cancel delete alert
    const cancelDeleteAlert=()=>{
      setDeleteAlert(false);
      setShowDeleteIcon(false);
    }

     // cancel delete icon when click message for delete
    const handleCloseDeleteIcon=()=>{
      setShowDeleteIcon(false);
    }

    /**--------------Backdrop------------- */

    // close backdrop in delete message alert
    const handleCloseBackdrop = () => {
      setOpenBackdrop(false);
    };

    // open backdrop in delete message alert
    const handleToggle = () => {
      setOpenBackdrop(!open);
    };


    return(
        <Fragment>

          {showDeleteIcon ?  
          <AppBar position="fixed" sx={{ backgroundColor:'#C40D42', boxShadow:'none',height:65, zIndex:'auto'}}>
            <Toolbar>
           
              <IconButton onClick={handleCloseDeleteIcon}>
                <CloseIcon  fontSize='small' style={{cursor:'pointer', color:'white'}} />
              </IconButton>
              <Box sx={{ flexGrow: 1 }} />
                <IconButton aria-label="delete" component="label" onClick={handleWhetherDeleteMessage}>
                    <DeleteOutlineOutlinedIcon  style={{cursor:'pointer',color:"white"}} />
                </IconButton>
             
            </Toolbar>
          </AppBar>: null}

          {showDeleteAlert ?  
          <Backdrop
            sx={{ color: 'black', zIndex: 20, height:'100%',}}
            open={openBackdrop}
            onClick={handleCloseBackdrop}
          >
              <div className="deleteDiv">
                    <Typography sx={{fontFamily:'system-ui',textAlign:'center',height:'10%' , position:'relative' , paddingTop:3}}>
                        Delete Message
                    </Typography>
                    <Typography sx={{height:'10%',fontFamily:'system-ui',textAlign:'center',position:'relative', fontSize:15 ,paddingLeft:2, paddingRight:2, paddingTop:5}}>
                        Are you sure you want to delete this message ?
                    </Typography>
                    <div className="buttonDivForDelete">
                        <Button onClick={cancelDeleteAlert}>Cancel</Button>
                        <Button style={{color:'red'}} onClick={handleDeleteMessages}>Delete</Button>
                    </div>
              </div>
          </Backdrop> : null}

          {/**messages in chat box */}
          <Box component="main" >
              <Toolbar />
              <Box sx={{ pb: 7 }} ref={ref}>
                        
                {/**msg list */}
                <div onScroll={handleScroll} ref={chatContainer} className="chatContainer">

                    <div className="vmBox">
                        <img src={bot} alt="bot" className="bot"/>
                       {/* <h4 className="title">VM</h4>*/}
                    </div>

                    <div color="black" style={{whiteSpace: 'pre-wrap',overflowWrap:'break-word',margin:-2,padding:10,maxWidth:'75vw',
                                background:"aliceblue", borderRadius:'8.92308px',boxShadow:'0px 4px 8px rgba(0, 0, 0, 0.12)', cursor:'pointer',position:"relative", left:10,top:40}}>
                        <Typography style={{fontFamily:'system-ui',whiteSpace: 'pre-wrap',overflowWrap:'break-word',fontSize:15, maxWidth:'50vw', cursor:'pointer',position:"relative", left:0,display:"flex", justifyContent:"start",}}>
                             Hi!, I'm automated virtual assistant. How may I help you today?
                        </Typography>
                        <br/>
                        <Typography style={{fontFamily:'system-ui',whiteSpace: 'pre-wrap',overflowWrap:'break-word',fontSize:15, maxWidth:'50vw',display:"flex", justifyContent:"start", cursor:'pointer',position:"relative", left:0,}}>
                             You can write a short & simple question or select from the following list of questions for your convenience.
                        </Typography>
                        <List>
                            <ListItem >
                                <ListItemIcon>
                                    <SchoolIcon fontSize="small"/>
                                </ListItemIcon>
                                <ListItemText style={{fontFamily:'system-ui',whiteSpace: 'pre-wrap',overflowWrap:'break-word',fontVariant: "all-petite-caps"}}>
                                            What are the State universities in Sri Lanka ?
                                        </ListItemText>
                            </ListItem>
                            <ListItem >
                                <ListItemIcon>
                                    <SchoolIcon fontSize="small"/>
                                </ListItemIcon>
                                <ListItemText style={{fontFamily:'system-ui',whiteSpace: 'pre-wrap',overflowWrap:'break-word',fontVariant: "all-petite-caps"}}>
                                    What are the Degree programs offered by Faculty of Arts in University of Colombo ?
                                </ListItemText>
                            </ListItem>
                            <ListItem>
                                <ListItemIcon>
                                    <SchoolIcon fontSize="small"/>
                                </ListItemIcon>
                                <ListItemText style={{fontFamily:'system-ui',whiteSpace: 'pre-wrap',overflowWrap:'break-word',fontVariant: "all-petite-caps"}}>
                                    What are the Degree programs offered by Faculty of Education in University of Colombo ?
                                </ListItemText>
                            </ListItem>
                            <ListItem >
                                <ListItemIcon>
                                    <SchoolIcon fontSize="small"/>
                                </ListItemIcon>
                                <ListItemText style={{fontFamily:'system-ui',whiteSpace: 'pre-wrap',overflowWrap:'break-word',fontVariant: "all-petite-caps"}}>
                                    What are the Degree programs offered by Faculty of Agriculture in University of Peradeniya ?
                                </ListItemText>
                            </ListItem>
                            <ListItem>
                                <ListItemIcon>
                                    <SchoolIcon fontSize="small"/>
                                </ListItemIcon>
                                <ListItemText style={{fontFamily:'system-ui',whiteSpace: 'pre-wrap',overflowWrap:'break-word',fontVariant: "all-petite-caps"}}>
                                    What are the Degree programs offered by Faculty of Medicine in University of Colombo ?
                                </ListItemText>
                            </ListItem>
                            <ListItem>
                                <ListItemIcon>
                                    <HelpIcon fontSize="small"/>
                                </ListItemIcon>
                                <ListItemText style={{fontFamily:'system-ui',whiteSpace: 'pre-wrap',overflowWrap:'break-word',fontVariant: "all-petite-caps"}}>
                                    Need Help
                                </ListItemText>
                            </ListItem>
                        </List>
                    </div>

                     {messages.length === 0 ? null :messages.map(({id, user, message,date, time}, index) => (
                         <List sx={{position:'relative',top:48}}>
                            {index === 0 || messages[index - 1].date !== date ? (
                                <>
                                    {/** display date*/}
                                    <Divider variant="middle" >
                                        <ListSubheader
                                            style={{display:'flex',justifyContent:'center',borderRadius:5,}}>

                                            {new Date().toDateString() === new Date(date).toDateString() ? 'Today' :
                                                <>{new Date(new Date().getTime() - 86400000).toDateString() === new Date(date).toDateString() ? 'Yesterday' : new Date(date).toDateString()}</>
                                            }

                                        </ListSubheader>
                                    </Divider>
                                </>
                            ) : null}

                            <ListItem  key={id} sx={{display:'flex',justifyContent:admin == "false" ? user === "user" ? "end":"start" : user === "admin" ? "end":"start"}} >
                                <div className="listItemContainer">
                                    <div>
                                        {user === "bot" ? <img src={botIcon} align="icon" className="botIcon"/> : null}
                                        <Typography color="black"
                                            style={{fontFamily:'system-ui',whiteSpace: 'pre-wrap',overflowWrap:'break-word',margin:-2,padding:10,fontSize:14,maxWidth:'75vw', background:admin == "false" ? user === "user" ? '#F6DBE3' : "aliceblue" : user === "admin" ? '#F6DBE3' : "aliceblue",
                                                borderTopLeftRadius:user !== "bot"? 0 :'8.92308px',borderBottomLeftRadius:'8.92308px',borderBottomRightRadius:user === "bot"? 0 :'8.92308px',borderTopRightRadius:'8.92308px',boxShadow:'0px 4px 8px rgba(0, 0, 0, 0.12)', cursor:'pointer'}}
                                            onContextMenu={(e)=>{
                                                e.preventDefault();
                                                if(user === "user"){
                                                    setShowDeleteIcon(true);
                                                    setDeleteMessage(id)
                                                }else{

                                                }
                                        }}>
                                            {message === "I'm sorry, I'm unable to understand your question. Please state your question more clearly or select one of the below shortcut queries, so that I can give my best to answer your question." ?
                                                <>
                                                    {message}
                                                    <br/>
                                                    <br/>
                                                    <Typography style={{fontFamily:'system-ui',whiteSpace: 'pre-wrap',overflowWrap:'break-word',fontSize:14, display:"flex", justifyContent:"start", cursor:'pointer',position:"relative", left:0,}}>
                                                        Otherwise you can provide your email address and we will contact you through our representative.
                                                    </Typography>
                                                    <List>
                                                        <ListItem>
                                                            <ListItemIcon>
                                                                <SchoolIcon fontSize="small"/>
                                                            </ListItemIcon>
                                                            <ListItemText style={{fontFamily:'system-ui',whiteSpace: 'pre-wrap',overflowWrap:'break-word',fontVariant: "all-petite-caps"}}>
                                                                What are the State universities in Sri Lanka ?
                                                            </ListItemText>
                                                        </ListItem>
                                                        <ListItem >
                                                            <ListItemIcon>
                                                                <SchoolIcon fontSize="small"/>
                                                            </ListItemIcon>
                                                            <ListItemText style={{fontFamily:'system-ui',whiteSpace: 'pre-wrap',overflowWrap:'break-word',fontVariant: "all-petite-caps"}}>
                                                                What are the Degree programs offered by Faculty of Arts in University of Colombo ?
                                                            </ListItemText>
                                                        </ListItem>
                                                        <ListItem>
                                                            <ListItemIcon>
                                                                <SchoolIcon fontSize="small"/>
                                                            </ListItemIcon>
                                                            <ListItemText style={{fontFamily:'system-ui',whiteSpace: 'pre-wrap',overflowWrap:'break-word',fontVariant: "all-petite-caps"}}>
                                                                What are the Degree programs offered by Faculty of Education in University of Colombo ?
                                                            </ListItemText>
                                                        </ListItem>
                                                        <ListItem >
                                                            <ListItemIcon >
                                                                <SchoolIcon fontSize="small"/>
                                                            </ListItemIcon>
                                                            <ListItemText style={{fontFamily:'system-ui',whiteSpace: 'pre-wrap',overflowWrap:'break-word',fontVariant: "all-petite-caps"}}>
                                                                What are the Degree programs offered by Faculty of Agriculture in University of Peradeniya ?
                                                            </ListItemText>
                                                        </ListItem>
                                                        <ListItem>
                                                            <ListItemIcon>
                                                                <SchoolIcon fontSize="small"/>
                                                            </ListItemIcon>
                                                            <ListItemText style={{fontFamily:'system-ui',whiteSpace: 'pre-wrap',overflowWrap:'break-word',fontVariant: "all-petite-caps"}}>
                                                                What are the Degree programs offered by Faculty of Medicine in University of Colombo ?
                                                            </ListItemText>
                                                        </ListItem>
                                                        <ListItem>
                                                            <ListItemIcon>
                                                                <HelpIcon fontSize="small"/>
                                                            </ListItemIcon>
                                                            <ListItemText style={{fontFamily:'system-ui',whiteSpace: 'pre-wrap',overflowWrap:'break-word',fontVariant: "all-petite-caps"}}>
                                                                Need Help
                                                            </ListItemText>
                                                        </ListItem>
                                                        <ListItem>
                                                            <ListItemIcon>
                                                                <CallIcon fontSize="small"/>
                                                            </ListItemIcon>
                                                            <ListItemText style={{fontFamily:'system-ui',whiteSpace: 'pre-wrap',overflowWrap:'break-word',fontVariant: "all-petite-caps"}}>
                                                                I want talk with human assistant
                                                            </ListItemText>
                                                        </ListItem>
                                                    </List>
                                                </>
                                                :
                                                message
                                            }
                                            <Typography variant="body2" color="text.dark" style={{fontSize:9,color:'dimgray',
                                                display:'flex',justifyContent:"end",position:'relative', top:5}}>
                                                {handleTime(time)}
                                            </Typography>
                                        </Typography>
                                    </div>
                                </div>
                            </ListItem>

                         </List>
                      ))}
                </div>
              </Box>
          </Box>
          
          {/**footer */}
            <AppBar position="fixed" color="inherit" sx={{ top: 'auto', bottom: 4,boxShadow:'none',width:'100%', display: 'flex' ,zIndex:5,}}>

              <Toolbar>

                <Box sx={{ flexGrow: 3 }} />
                <TextField className={style.root}
                           multiline maxRows={2}
                           value={text}
                           inputProps={{ ref: inputRef }}
                           onChange={(event)=>{
                                setText(event.target.value.toString());
                                if (inputRef.current.value === '') {
                                  setVisibleSendIcon(false);
                                }else{
                                  setVisibleSendIcon(true);
                                }
                           }}
                           size="small"
                           placeholder={admin == "false" ? "Message" : "Please leave your email here."}
                           fullWidth
                           style={{backgroundColor:'rgba(255, 255, 255, 0.12)',padding:5,borderColor:'transparent'}}
                           InputProps={{
                              endAdornment: (
                                visibleSendIcon ?
                                    <InputAdornment position="end"
                                                    onClick={handleSendMessages}
                                                    style={{cursor:'pointer'}}
                                    >
                                        <SendIcon edge="end" />
                                    </InputAdornment>
                                    :
                                    ""
                              )
                           }}
                />

              </Toolbar> 

            </AppBar>

        </Fragment>
    );
}

export default ChatBox;

