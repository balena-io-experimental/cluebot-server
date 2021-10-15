import * as React from 'react';
import { useState, useEffect } from 'react';

import { GlobalStyle } from './style';
import Question from './components/Question';
import Form from './components/Form';

const App:React.FC = () => {
    const [question, setQuestion] = useState<string>('');

    useEffect(() => {
      fetch('/api/question')
        .then(resp => resp.json())
        .then((resp) => {
          if (resp.question) {
            setQuestion(resp.question);
          } else {
            throw(resp);
          }
        })
        .catch((err) => {
          console.error(err);
          setQuestion('Cluebot-chan is sick ＞︿＜ contact the devs or try again later');
        });
    }, []);
    return (
        <> 
          <GlobalStyle />
          <Question question={question} />
          <Form />
        </>
    );
}

export default App;