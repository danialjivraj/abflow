const TopBar = ({ buttons, openModal }) => {
    return (
      <div className="top-bar">
        {buttons.map((button, index) => (
          <button
            key={index}
            onClick={() => button.onClick(openModal)}
            className={button.className}
          >
            {button.label}
          </button>
        ))}
      </div>
    );
  };
  
  export default TopBar;