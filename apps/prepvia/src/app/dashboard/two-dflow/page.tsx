'use client';

import React from 'react';

const page = () => {
  return (
    <div style={{ height: '100%' }}>
      <iframe
        src='https://app.2dworkflow.com/login.jsf'
        style={{ width: '100%', height: '100%', border: 'none' }}
        title='2D Workflow Iframe'
      />
    </div>
  );
};

export default page;
