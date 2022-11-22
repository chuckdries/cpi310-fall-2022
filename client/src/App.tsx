import axios from "axios";
import { useEffect, useState } from "react";

interface MessageWithAuthor {
  id: number;
  body: string;
  author: string;
}

function App() {
  const [messages, setMessages] = useState([] as MessageWithAuthor[]);

  useEffect(() => {
    axios.get("http://localhost:3000/").then(({ data }) => {
      setMessages(data.messages);
    });
  }, []);

  return (
    <div className="App">
      <ul>
        {messages.map((message) => (
          <li>
            {message.author}: {message.body}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default App;
