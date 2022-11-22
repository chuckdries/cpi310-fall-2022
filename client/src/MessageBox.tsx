import axios from "axios";
import { useState } from "react";

function MessageBox() {
  const [messageInput, setMessageInput] = useState("");

  const onSendMessage = async () => {
    const { data } = await axios.post("http://localhost:3000/message", {
      message: messageInput
    });
  }

  return (
    <div>
      <label>
        message:{" "}
        <input
          type="text"
          value={messageInput}
          onChange={(e) => setMessageInput(e.target.value)}
        />
      </label>
      <button type="button" onClick={onSendMessage}>send</button>
    </div>
  );
}

export default MessageBox;
