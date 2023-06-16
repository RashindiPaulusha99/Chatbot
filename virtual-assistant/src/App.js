import './App.css';
import { Switch, Route } from 'react-router-dom';
import ChatRoom from "./pages/ChatRoom";
import NotFoundPage from "./pages/NotFoundPage";

function App() {

  const roomId=1;
  const userId=1;
  const admin = false;

  return (
      <Switch>
          <Route path='/' exact>
              <NotFoundPage/>
          </Route>
          <Route path='/chatbot/roomId=:roomId&userId=:userId&admin=:admin'>
              <ChatRoom/>
          </Route>
          <Route path='*'>
              <NotFoundPage/>
          </Route>
      </Switch>
  );
}

export default App;
