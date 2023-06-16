import React from "react";
import PageNotFound from "../assets/Styles/PageNotFound.scss";
import notFoundIcon from "../assets/Images/search-bot-in-cartoon-style-artificial-vector-42563588.jpg";
import notFound from "../assets/Images/modern-colorful-404-page-not-found-error-background-illustration-404-error-background-can-use-for-web-banner-infographics-vector-removebg-preview.png";
import Typography from "@mui/material/Typography";


const NotFoundPage=(props)=>{
    return(
        <div className="container">
            <div>
                <img src={notFound} className="notFound"/>
                <img src={notFoundIcon} className="notFoundIcon"/>
            </div>
            <div>
                <Typography style={{fontFamily:'sans-serif',whiteSpace: 'pre-wrap',overflowWrap:'break-word',fontSize:14,position:"relative", left:0,right:0,margin:"auto",top:400,textAlign:"center",width:350}}>
                    The chat you are looking for may have been moved, deleted or possibly never existed.
                </Typography>
            </div>
        </div>
    );
}

export default NotFoundPage;
