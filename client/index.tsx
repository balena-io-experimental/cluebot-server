import { render } from 'react-dom';
import * as React from 'react';

import App from './components/App';

render(
    <App />,
    document.getElementById('root') as HTMLDivElement 
);