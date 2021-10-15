import * as React from 'react';
import { useState } from 'react';
import styled from 'styled-components';

import { FlexDiv, theme } from '../style';
import Box from './win95/Box';
import DialogueHeader from './win95/DialogueHeader';

const StyledForm = styled(Box)`
    margin-top: 5em;
    box-sizing: border-box;
`;

const StyledFormBody = styled(FlexDiv)`
    padding: 2px 5px;
    & label, & input, & textarea {
        width: 100%;
        font-size: 1.2em;
    }
    & label {
        margin-bottom: 2px;
    }
    & input, & textarea  {
        padding: 5px;
        margin-bottom: 7px;
        outline: none;
        height: 30px;
        font-family: ${theme.global.font.family};
    }
    & textarea {
        height: 60px;
    }
`;

const StyledMessage = styled.div<{ isError: boolean }>`
    min-height: 20px;
    font-size: 14px;
    color: ${p => p.isError ? 'red' : 'black' }
`;

const Form:React.FC = () => {
    const [handle, setHandle] = useState<string>('');
    const [answer, setAnswer] = useState<string>('');
    const [status, setStatus] = useState<{ message: string, isError: boolean }>({ message: ' ', isError: false });

    const handleSubmit = () => {
        if (!handle || !answer) {
            setStatus({ message: 'Did you forget something? 👀', isError: true });
        } else {
            fetch('/api/answer', { 
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ 
                    handle: handle, 
                    answer: answer 
                })
            })
            .then((resp) => resp.json())
            .then((resp) => {
                if (resp.error) { 
                    throw resp;
                }
                setHandle('');
                setAnswer('');
                setStatus({ message: 'Thanks bae, come back later 😘', isError: false })
            })
            .catch(({ error }) => {
                console.error(error);
                setStatus({ message: 'Cluebot might be sick with a case of internal server error 🙈', isError: false })
            });
        }
    }

    return (
        <StyledForm
            w={'min(700px, 80%)'}
        >
            <div>
                <DialogueHeader 
                    header={'Cluebot Senpai'}
                    iconSrc={'/static/owo_whats_this_smol.png'}
                />
                <StyledFormBody
                    flexDirection={'column'}
                    alignItems={'center'}
                >
                    <label htmlFor="handle">Enter your Flowdock handle:</label>
                    <input 
                        id="handle"
                        type="text"
                        spellCheck="false" 
                        autoComplete="false"
                        value={handle}
                        onChange={(e) => setHandle(e.target.value)}
                    />
                    <label htmlFor="answer">What's your answer?</label>
                    <textarea 
                        id="answer"
                        spellCheck="false"
                        value={answer}
                        onChange={(e) => setAnswer(e.target.value)}
                    />
                    <StyledMessage 
                        isError={status.isError}
                    >
                        {status.message}
                    </StyledMessage>
                    <Box
                        w={'100px'}
                        isButton
                    >
                        <div onClick={handleSubmit}>Go!</div>
                    </Box>
                </StyledFormBody>
            </div>
        </StyledForm>
    );
}

export default Form;
