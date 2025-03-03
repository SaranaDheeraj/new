import { useRef } from "react";
import { FaDownload, FaTrash, FaEdit,FaUpload } from "react-icons/fa";
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

const API_BASE = "http://3.27.213.223:5333";
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
  const fileInputRef = useRef(null);

  const onItemClick = (e) => {
    e.stopPropagation();
    // For directories, toggle children visibility
    if (item.is_directory) {
      toggleFolder(path);
    }
  };
  const onUploadClick = (e) => {
    e.stopPropagation();
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const onFileSelected = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
   
    const uploadPath = path;

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
        // alert("Upload failed.");
    } finally {
        e.target.value = null; 
    }
};


  return (
    <li data-path={path} className="tree-item">
      <div className={`tree-row ${item.is_directory ? "directory" : ""}`} onClick={onItemClick}>
        <img
          className="tree-icon"
          src={
            item.is_directory
              ? "https://cdn-icons-png.flaticon.com/512/716/716784.png"
              : getFileIcon(item.name)
          }
          alt="icon"
          width="18"
        />
        <span className="tree-label">{item.name}</span>
        <div className="action-icons">
        {item.is_directory && (
            <>
              <FaUpload title="Upload" className="icon" onClick={onUploadClick} />
              <input
                type="file"
                ref={fileInputRef}
                style={{ display: "none" }}
                onChange={onFileSelected}
              />
            </>
          )}
          <FaDownload title="Download" className="icon " onClick={(e) => { e.stopPropagation(); handleDownload(path, item.is_directory); }} />
          <FaEdit title="Rename" className="icon" onClick={(e) => { e.stopPropagation(); handleRename(path); }} />
          <FaTrash title="Delete" className="icon" onClick={(e) => { e.stopPropagation(); handleDelete(path); }} />
        </div>
      </div>

      {item.is_directory && isOpen && (
        <ul className="tree-children">
          {item.children &&
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
              />
            ))}
        </ul>
      )}
    </li>
  );
};
function getFileIcon(fileName) {
    const extension = fileName.split(".").pop().toLowerCase();
    return fileTypeIcons[extension] || fileTypeIcons.default;
  }
export default TreeItem;