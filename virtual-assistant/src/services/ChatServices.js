import axios from "../data/Axios";

class ChatServices {

    sendMessage = async (body)=>{

        const promise = new Promise((resolve, reject) =>{

            axios.post('/chat/sendMessage',

                JSON.stringify(body),
                {headers:{
                        'Content-Type':'application/json'
                    }},
            )
                .then((res) =>{
                    return resolve(res)
                }).catch((error) =>{
                return resolve(error)
            })
        })
        return await promise
    }

    fetchHistory = async (userId,roomId)=>{

        const promise = new Promise((resolve, reject) =>{

            axios.get(`/chat/getMessages/${userId}/${roomId}`,{
                headers:{
                    'Content-Type':'application/json'
                }
            })
                .then((res) =>{
                    return resolve(res)
                }).catch((error) =>{
                return resolve(error)
            })
        })
        return await promise
    }

    fetchMessageCount = async (userId,roomId)=>{

        const promise = new Promise((resolve, reject) =>{

            axios.get(`/chat/getMessageCount/${userId}/${roomId}`,{
                headers:{
                    'Content-Type':'application/json'
                }
            })
                .then((res) =>{
                    return resolve(res)
                }).catch((error) =>{
                return resolve(error)
            })
        })
        return await promise
    }

    deleteMessage = async (body)=>{

        const promise = new Promise((resolve, reject) =>{

            axios.post('/chat/deleteMessage',

                JSON.stringify(body),
                {headers:{
                        'Content-Type':'application/json'
                    }},
            )
                .then((res) =>{
                    return resolve(res)
                }).catch((error) =>{
                return resolve(error)
            })
        })
        return await promise
    }

}

export default new ChatServices;