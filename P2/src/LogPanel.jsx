import { useEffect, useRef } from "react";
import { FaDownload } from "react-icons/fa";

const LogPanel = ({ title, logs, onDownload }) => {
  const containerRef = useRef(null);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [logs]);

  return (
    <div  ref={containerRef}>
      <div  className="d-flex justify-content-between">
      <h3
      >
        {title}
      </h3>
      <button
          onClick={onDownload}
          className="btn  btn-sm d-flex align-items-center" 
        >
          <FaDownload className="me-2" /> Download
        </button>
      </div>
      {logs.map((log, index) => (
        <div key={index}>
          {log}
        </div>
      ))}
    </div>
  );
};

export default LogPanel;