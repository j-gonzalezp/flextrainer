import React from 'react';


interface ActiveButtonProps {
  isActive: boolean;
  onClick: () => void;

}

const ActiveButton: React.FC<ActiveButtonProps> = ({ isActive, onClick }) => {

  return (
    <button
      onClick={onClick}
      style={{
        backgroundColor: isActive ? 'green' : 'red',
        color: 'white',
        padding: '5px 10px',
        border: 'none',
        borderRadius: '5px',
        cursor: 'pointer',
      }}
    >
      {isActive ? 'Active' : 'Paused'}
    </button>
  );
};

export default ActiveButton;