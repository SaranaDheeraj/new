import React, { useState, useEffect, useRef } from "react";
import io from "socket.io-client";
import './App.css';

const API_BASE = "http://13.236.84.109:5333";

const fileTypeIcons = {
  txt: "https://cdn-icons-png.flaticon.com/512/136/136525.png",
  py: "https://cdn-icons-png.flaticon.com/512/337/337947.png",
  jpg: "https://cdn-icons-png.flaticon.com/512/136/136524.png",
  png: "https://cdn-icons-png.flaticon.com/512/136/136524.png",
  jpeg: "https://cdn-icons-png.flaticon.com/512/136/136524.png",
  pdf: "https://cdn-icons-png.flaticon.com/512/337/337946.png",
  doc: "https://cdn-icons-png.flaticon.com/512/337/337953.png",
  docx: "https://cdn-icons-png.flaticon.com/512/337/337953.png",
  default: "https://cdn-icons-png.flaticon.com/512/565/565547.png",
};

function getFileIcon(fileName) {
  const extension = fileName.split(".").pop().toLowerCase();
  return fileTypeIcons[extension] || fileTypeIcons.default;
}

// Modified TreeItem that now displays action buttons
const TreeItem = ({
  item,
  parentPath,
  openFolders,
  toggleFolder,
  handleDownload,
  handleDelete,
  handleRename,
  handleUpload,
}) => {
  const path = `${parentPath}/${item.name}`.replace(/^\//, "");
  const isOpen = openFolders[path] || false;

  const onItemClick = (e) => {
    e.stopPropagation();
    // For directories, toggle children visibility
    if (item.is_directory) {
      toggleFolder(path);
    }
  };

  return (
    <li
      data-path={path}
      style={{
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        margin: "5px 0",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", flex: 1 }} onClick={onItemClick}>
        <img
          className="icon"
          src={
            item.is_directory
              ? "https://cdn-icons-png.flaticon.com/512/716/716784.png"
              : getFileIcon(item.name)
          }
          alt=""
          style={{ width: "16px", height: "16px", marginRight: "5px" }}
        />
        <span>{item.name}</span>
      </div>
      <div style={{ display: "flex", gap: "5px" }}>
        {item.is_directory ? (
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleDownload(path, true);
            }}
            title="Download folder as zip"
          >
            ZIP
          </button>
        ) : (
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleDownload(path, false);
            }}
            title="Download file"
          >
            DL
          </button>
        )}
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleDelete(path);
          }}
          title="Delete item"
        >
          DEL
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleRename(path);
          }}
          title="Rename item"
        >
          REN
        </button>
        {item.is_directory && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleUpload(path);
            }}
            title="Upload file to folder"
          >
            UP
          </button>
        )}
      </div>
      {item.is_directory && (
        <ul
          className="line"
          style={{
            listStyle: "none",
            paddingLeft: "10px",
            margin: 0,
            borderLeft: "1px solid #ccc",
            marginLeft: "20px",
            display: isOpen ? "block" : "none",
          }}
        >
          {isOpen &&
            item.children &&
            item.children.map((child) => (
              <TreeItem
                key={child.name}
                item={child}
                parentPath={path}
                openFolders={openFolders}
                toggleFolder={toggleFolder}
                handleDownload={handleDownload}
                handleDelete={handleDelete}
                handleRename={handleRename}
                handleUpload={handleUpload}
              />
            ))}
        </ul>
      )}
    </li>
  );
};

const FileTree = ({
  tree,
  openFolders,
  toggleFolder,
  handleDownload,
  handleDelete,
  handleRename,
  handleUpload,
}) => {
  return (
    <ul
      id="file-tree"
      style={{
        listStyle: "none",
        paddingLeft: "10px",
        margin: 0,
        border: "1px solid #ccc",
        borderRadius: "5px",
        padding: "10px",
        margin: "10px",
      }}
    >
      {tree.map((item) => (
        <TreeItem
          key={item.name}
          item={item}
          parentPath=""
          openFolders={openFolders}
          toggleFolder={toggleFolder}
          handleDownload={handleDownload}
          handleDelete={handleDelete}
          handleRename={handleRename}
          handleUpload={handleUpload}
        />
      ))}
    </ul>
  );
};

const LogPanel = ({ title, logs, onDownload }) => {
  const containerRef = useRef(null);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [logs]);

  return (
    <div style={{ flex: 1, padding: "10px", overflowY: "auto" }} ref={containerRef}>
      <h3
        style={{
          margin: "10px 0",
          fontSize: "16px",
          textAlign: "center",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {title}
        <button
          onClick={onDownload}
          style={{
            marginLeft: "10px",
            cursor: "pointer",
            border: "1px solid #ccc",
            background: "#f7f7f7",
            padding: "3px 8px",
            borderRadius: "4px",
            display: "flex",
            alignItems: "center",
          }}
        >
          Download
          <img
            src="https://cdn-icons-png.flaticon.com/512/892/892342.png"
            alt="download icon"
            style={{ width: "16px", height: "16px", marginLeft: "5px" }}
          />
        </button>
      </h3>
      {logs.map((log, index) => (
        <div key={index} className="log-entry" style={{ marginBottom: "5px", fontSize: "14px" }}>
          {log}
        </div>
      ))}
    </div>
  );
};

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

  // Download handlers for logs
  const downloadTreeLogs = () => window.open(`${API_BASE}/download-logs/tree`, "_blank");
  const downloadNetworkLogs = () => window.open(`${API_BASE}/download-logs/network`, "_blank");

  // API Action Handlers

  // Download file or folder as zip
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

  // Trigger file upload (opens file dialog)
  const handleUpload = (path) => {
    setUploadPath(path);
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  // Handle file selection and upload
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
    <div style={{ display: "flex", height: "100vh", margin: 0, padding: 0, fontFamily: "Arial, sans-serif" }}>
      {/* Hidden file input for upload */}
      <input type="file" ref={fileInputRef} style={{ display: "none" }} onChange={onFileSelected} />

      {/* Left panel: File Tree */}
      <div id="tree-view" style={{ width: "50%", borderRight: "2px solid black", display: "flex", flexDirection: "column" }}>
        <h3 style={{ margin: "10px 0", fontSize: "16px", textAlign: "center" }}>Tree View</h3>
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
      <div id="logs" style={{ width: "50%", display: "flex", flexDirection: "column" }}>
        <div id="tree-logs" style={{ flex: 1, borderBottom: "2px solid black", display: "flex", flexDirection: "column" }}>
          <LogPanel title="Tree Logs" logs={treeLogs} onDownload={downloadTreeLogs} />
        </div>
        <div id="network-logs" style={{ flex: 1, display: "flex", flexDirection: "column" }}>
          <LogPanel title="Network Logs" logs={networkLogs} onDownload={downloadNetworkLogs} />
        </div>
      </div>
    </div>
  );
}

export default App;
