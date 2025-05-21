import { useEffect, useRef, useState } from "react";
import music from "./iphone-sms-tone-original-mp4-5732.mp3";

const Chat = ({ socket, username, room }) => {
  const [currentMessage, setCurrentMessage] = useState("");
  const [messageList, setMessageList] = useState([]);
  const notification = new Audio(music);
  const containRef = useRef(null);

  // Fetch past messages when room changes or on mount
  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const res = await fetch(`https://chat-app-usc4.onrender.com/messages/${room}`);
        const data = await res.json();
        setMessageList(data);
      } catch (err) {
        console.error("Failed to fetch messages:", err);
      }
    };
    fetchMessages();
  }, [room]);

  const sendMessage = async () => {
    if (currentMessage !== "") {
      const messageData = {
        id: Math.random(),
        room: room,
        author: username,
        message: currentMessage,
        time:
          (new Date(Date.now()).getHours() % 12) +
          ":" +
          new Date(Date.now()).getMinutes(),
      };
      await socket.emit("send_message", messageData);
      setMessageList((list) => [...list, messageData]);
      setCurrentMessage("");
      notification.play();
    }
  };

  useEffect(() => {
    const handleReceiveMsg = (data) => {
      setMessageList((list) => [...list, data]);
    };
    socket.on("receive_message", handleReceiveMsg);
    return () => {
      socket.off("receive_message", handleReceiveMsg);
    };
  }, [socket]);

  useEffect(() => {
    if (containRef.current) {
      containRef.current.scrollTop = containRef.current.scrollHeight;
    }
  }, [messageList]);

  return (
    <div className="chat_container">
      <h1>Welcome {username}</h1>
      <div className="chat_box">
        <div
          className="auto-scrolling-div"
          ref={containRef}
          style={{
            height: "450px",
            overflowY: "auto",
            border: "2px solid yellow",
          }}
        >
          {messageList.map((data) => (
            <div
              key={data._id || data.id} // _id from Mongo or fallback id
              className="message_content"
              id={username === data.author ? "you" : "other"}
            >
              <div className="msg" id={username === data.author ? "y" : "b"}>
                <p>{data.message}</p>
              </div>
              <div className="msg_detail">
                <p>{data.author}</p>
                <p>{data.time}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="chat_body">
          <input
            type="text"
            placeholder="Type Your Message"
            value={currentMessage}
            onChange={(e) => setCurrentMessage(e.target.value)}
            onKeyDown={(e) => {
              e.key === "Enter" && sendMessage();
            }}
          />
          <button onClick={sendMessage}>&#9658;</button>
        </div>
      </div>
    </div>
  );
};

export default Chat;
