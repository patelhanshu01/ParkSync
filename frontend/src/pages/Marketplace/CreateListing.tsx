import React from 'react';

const containerStyle: React.CSSProperties = { padding: '24px' };

const CreateListing: React.FC = () => {
  return (
    <div style={containerStyle}>
      <h2>Marketplace Listing</h2>
      <p>Listing creation UI is coming soon.</p>
    </div>
  );
};

export default React.memo(CreateListing);
