import React from 'react';
import ReactDOM from 'react-dom/client';
// import './index.css';
// import PageEntry from './pageEntry.jsx';
import PageEntry from './vrmRoot.jsx';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  // <React.StrictMode>
    <PageEntry/>
  // </React.StrictMode>
);

// import App from './app'

// ReactDOM.render(<PageEntry/>, document.querySelector('#root'))