import axios from "axios";
import { useState } from "react";

interface LoginProps {
  onLoginSuccess: (username: string) => void;
}

function Login({ onLoginSuccess }: LoginProps) {
  const [userInput, setUserInput] = useState("");
  const [passInput, setPassInput] = useState("");

  const onLoginClick = async () => {
    const { data } = await axios.post("http://localhost:3000/login", {
      username: userInput,
      password: passInput,
    });
    onLoginSuccess(data.username);
  };

  return (
    <div>
      <label>
        username:
        <input
          type="text"
          value={userInput}
          onChange={(e) => setUserInput(e.target.value)}
        />
      </label>
      <label>
        password:
        <input
          type="password"
          value={passInput}
          onChange={(e) => setPassInput(e.target.value)}
        />
      </label>
      <button type="button" onClick={onLoginClick}>
        Login
      </button>
    </div>
  );
}

export default Login;
