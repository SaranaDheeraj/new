import TreeItem from "./TreeItem";

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
    <ul className="tree-list tree-container"
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

export default FileTree;