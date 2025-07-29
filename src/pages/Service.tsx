import React, { useEffect, useRef } from 'react';
// import axios from 'axios';
import toast from 'react-hot-toast';

const Service = () => {
  const hasAlerted = useRef(false);

  useEffect(() => {
    if (!hasAlerted.current) {
        toast.error('Feature will be added in future');
    //   alert('Feature will be added in future');
      hasAlerted.current = true;
    }
  }, []);

  return (
    <div className="p-6">
      <div className="bg-yellow-100 text-yellow-800 border border-yellow-300 rounded-md p-4 shadow">
        <h1 className="text-xl font-semibold mb-2">Service And Complaint</h1>
        <p>Feature will be added in future</p>
      </div>
    </div>
  );
};

export default Service;
