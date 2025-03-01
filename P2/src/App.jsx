import React, { useState, useEffect, useRef } from "react";
import io from "socket.io-client";
import './App.css';
import FileTree from "./FileTree";
import LogPanel from "./LogPanel";
import 'bootstrap/dist/css/bootstrap.min.css';


const API_BASE = "http://13.239.133.196:5333";


function App() {
  const [tree, setTree] = useState([]);
  const [openFolders, setOpenFolders] = useState({});
  const [treeLogs, setTreeLogs] = useState([]);
  const [networkLogs, setNetworkLogs] = useState([]);
  const socketRef = useRef(null);
  const fileInputRef = useRef(null);
  const [uploadPath, setUploadPath] = useState("");

  const toggleFolder = (path) => {
    setOpenFolders((prev) => ({ ...prev, [path]: !prev[path] }));
  };

  const appendLog = (setter, message) => {
    setter((prev) => [...prev, message]);
  };

  const loadFileTree = async () => {
    try {
      const response = await fetch(`${API_BASE}/files`);
      if (!response.ok) {
        throw new Error(`Failed to load file tree: ${response.status}`);
      }
      const data = await response.json();
      setTree(data.files || []);
    } catch (error) {
      console.error("Error fetching file tree:", error);
      appendLog(setNetworkLogs, `[ERROR] Could not fetch file tree: ${error}`);
    }
  };


  const downloadTreeLogs = () => window.open(`${API_BASE}/download-logs/tree`, "_blank");
  const downloadNetworkLogs = () => window.open(`${API_BASE}/download-logs/network`, "_blank");


  const handleDownload = (path, isDirectory) => {
    const url = isDirectory
      ? `${API_BASE}/download-folder-zip?path=${encodeURIComponent(path)}`
      : `${API_BASE}/download-file?path=${encodeURIComponent(path)}`;
    window.open(url, "_blank");
  };

  // Delete a file or folder
  const handleDelete = async (path) => {
    if (!window.confirm(`Are you sure you want to delete ${path}?`)) return;
    try {
      const response = await fetch(`${API_BASE}/delete-item?path=${encodeURIComponent(path)}`, {
        method: "DELETE",
      });
      const data = await response.json();
      if (data.error) {
        alert(`Error: ${data.error}`);
      } else {
        alert(data.message);
        loadFileTree();
      }
    } catch (error) {
      console.error("Delete error:", error);
      alert("Delete failed.");
    }
  };

  // Rename a file or folder
  const handleRename = async (oldPath) => {
    const newPath = window.prompt("Enter the new full path:", oldPath);
    if (!newPath || newPath === oldPath) return;
    try {
      const response = await fetch(
        `${API_BASE}/rename-item?oldPath=${encodeURIComponent(oldPath)}&newPath=${encodeURIComponent(newPath)}`,
        { method: "PUT" }
      );
      const data = await response.json();
      if (data.error) {
        alert(`Error: ${data.error}`);
      } else {
        alert(data.message);
        loadFileTree();
      }
    } catch (error) {
      console.error("Rename error:", error);
      alert("Rename failed.");
    }
  };

  const handleUpload = (path) => {
    setUploadPath(path);
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const onFileSelected = async (e) => {
    const file = e.target.files[0];
    if (!file || !uploadPath) return;
    const formData = new FormData();
    formData.append("file", file);
    try {
      const response = await fetch(`${API_BASE}/upload-file?path=${encodeURIComponent(uploadPath)}`, {
        method: "POST",
        body: formData,
      });
      const data = await response.json();
      if (data.error) {
        alert(`Upload error: ${data.error}`);
      } else {
        alert(data.message);
        loadFileTree();
      }
    } catch (error) {
      console.error("Upload error:", error);
      alert("Upload failed.");
    } finally {
      // Reset the file input so the same file can be reselected if needed.
      e.target.value = null;
      setUploadPath("");
    }
  };

  useEffect(() => {
    // Socket.IO connection
    const socket = io(API_BASE);
    socketRef.current = socket;

    socket.on("file_update", (data) => {
      console.log("file_update event:", data);
      const { event, file } = data;
      appendLog(setTreeLogs, `[FILE UPDATE] ${event.toUpperCase()} - ${file}`);
    });

    socket.on("update", (data) => {
      console.log("update event:", data);
      const { tree: newTree, path } = data;
      if (newTree) {
        setTree(newTree);
        appendLog(setTreeLogs, `[TREE UPDATE] Path: ${path}`);
      }
    });

    socket.on("connect", () => {
      appendLog(setNetworkLogs, "[NETWORK] Socket.IO connected");
    });

    socket.on("disconnect", () => {
      appendLog(setNetworkLogs, "[NETWORK] Socket.IO disconnected");
    });

    loadFileTree();

    return () => {
      socket.disconnect();
    };
  }, []);

  return (
    <div className="d-flex vh-100 p-4 gap-4 bg-dark justify-content-center">
      {/* Left panel: File Tree */}
      <div className="col-4 bg-light p-4 rounded shadow">
        <h3 className="mb-3">Tree View</h3>
        <FileTree
          tree={tree}
          openFolders={openFolders}
          toggleFolder={toggleFolder}
          handleDownload={handleDownload}
          handleDelete={handleDelete}
          handleRename={handleRename}
          handleUpload={handleUpload}
        />
      </div>
      
      {/* Right panel: Logs */}
      <div className="col-7 d-flex flex-column gap-4">
        <div className="bg-white p-4 rounded shadow flex-fill">
          <LogPanel title="Tree Logs" logs={treeLogs} onDownload={downloadTreeLogs} />
        </div>
        <div className="bg-white p-4 rounded shadow flex-fill">
          <LogPanel title="Network Logs" logs={networkLogs} onDownload={downloadNetworkLogs} />
        </div>
      </div>
    </div>
  );
}

export default App;
