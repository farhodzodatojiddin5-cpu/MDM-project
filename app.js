import { useEffect, useState } from "react";
import axios from "axios";
import { io } from "socket.io-client";
import DeviceStats from "./react";

const socket = io("http://localhost:3000");

function App() {
  const [devices, setDevices] = useState([]);

  useEffect(() => {
    fetchDevices();

    const handleDeviceUpdated = () => fetchDevices();
    socket.on("deviceUpdated", handleDeviceUpdated);

    return () => {
      socket.off("deviceUpdated", handleDeviceUpdated);
    };
  }, []);

  const fetchDevices = async () => {
    try {
      const res = await axios.get("http://localhost:3000/devices", {
        headers: { authorization: localStorage.getItem("token") }
      });
      setDevices(res.data);
    } catch (error) {
      console.error("Failed to load devices:", error);
    }
  };

  const lock = async (id) => {
    try {
      await axios.post(`http://localhost:3000/lock/${id}`, {}, {
        headers: { authorization: localStorage.getItem("token") }
      });
      fetchDevices();
    } catch (error) {
      console.error("Lock failed:", error);
    }
  };

  return (
    <div>
      <h1>MDM Dashboard</h1>
      <DeviceStats devices={devices} />
      {devices.map((d) => (
        <div key={d._id}>
          <h3>{d.name}</h3>
          <p>{d.status}</p>
          <button onClick={() => lock(d._id)}>Lock</button>
        </div>
      ))}
    </div>
  );
}

export default App;