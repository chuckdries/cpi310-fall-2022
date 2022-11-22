import axios from "axios";
import { useCallback, useEffect, useState } from "react";
import Login from "./Login";
import MessageBox from "./MessageBox";

axios.defaults.withCredentials = true;

interface MessageWithAuthor {
  id: number;
  body: string;
  author: string;
}

// type CURRENT_PAGE = 'home' | 'login' | 'register'

interface MessageProps {
  author: string;
  body: string;
}

function Message(props: MessageProps) {
  return (
    <li>
      {props.author}: {props.body}
    </li>
  );
}

function App() {
  const [messages, setMessages] = useState([] as MessageWithAuthor[]);
  const [user, setUser] = useState<null | string>(null);

  const testLogin = useCallback(async () => {
    try {
      const { data } = await axios.get("http://localhost:3000/user");
      if (data.user) {
        setUser(data.user);
      }
    } catch (e) {
      console.error("failed to test for user", e);
    }
  }, []);

  useEffect(() => {
    testLogin();
    axios.get("http://localhost:3000/messages").then(({ data }) => {
      setMessages(data.messages);
    });
  }, []);

  return (
    <div className="App">
      <ul>
        {messages.map((message) => (
          <Message
            key={message.id}
            author={message.author}
            body={message.body}
          />
        ))}
      </ul>
      {user ? (
        <MessageBox />
      ) : (
        <Login onLoginSuccess={(username) => setUser(username)} />
      )}
    </div>
  );
}

export default App;
