import { FaDownload, FaTrash, FaEdit } from "react-icons/fa";
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