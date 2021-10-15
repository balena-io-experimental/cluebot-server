import * as React from 'react';
import styled, { keyframes } from 'styled-components';

import { FlexDiv, theme } from '../style';
import BouncingLetter from './BouncingLetter';

const StyledHeading = styled.h1`
    font-size: 4em;
    width: 100%;
    padding: 0.5em;
    padding-left: 1em;
    margin-bottom: 0.5em;
    text-shadow: 
        1px 1px 0 ${theme.colors.vaporwave[1]},
        2px 2px 0 ${theme.colors.vaporwave[1]},
        3px 3px 0 ${theme.colors.vaporwave[2]},
        4px 4px 0 ${theme.colors.vaporwave[3]},
        5px 5px 0 ${theme.colors.vaporwave[4]},
        6px 6px 0 ${theme.colors.vaporwave[5]},
        7px 7px 0 ${theme.colors.vaporwave[6]};
`;

const StyledSubtitle = styled.div<{ small?: boolean }>`
    display: flex;
    font-size: 2em;
    padding-bottom: 1.5em;
    text-align: center;
    margin: 0 auto;
    ${p => p.small && 'font-size: 1.5em;'}
`;

const MoverKeyframe = keyframes`
    0% { transform: translateY(0); }
    100% { transform: translateY(-20px); }
`;

const StyledSenpai = styled.img`
    height: 80px;
    width: 80px;
    margin: 20px;
    animation: ${MoverKeyframe} 2s infinite  alternate;
    -webkit-animation: ${MoverKeyframe} 2s infinite  alternate;
`;

// .senpai{
//     display: flex;
//     flex-direction: row;
//     margin: auto;
//     width: 50%;
//     padding: 10px;
//     justify-content: center;
// }

// `;

type Props = {
    question: string;
}

const message = 'Maybe senpai will notice you';

const Question:React.FC<Props> = ({ question }) => {
    return (
        <>  
            <StyledHeading>Question: </StyledHeading>
            <StyledHeading>{question}</StyledHeading>
            <FlexDiv flexDirection={'column'}>
                <StyledSubtitle>Enter your answer below...</StyledSubtitle>
                <FlexDiv flexDirection={'row'} alignItems={'center'}>
                    <StyledSenpai src="/static/owo_whats_this_smol.png" />
                    <StyledSubtitle small>
                    {
                        message.split('').map((letter, idx) =>
                            <BouncingLetter 
                                letter={letter} 
                                delay={((idx + 1) * 0.1).toFixed(1)}
                                key={idx}
                            />
                        )
                    }
                    </StyledSubtitle>
                    <StyledSenpai src="/static/owo_whats_this_smol.png" />
                </FlexDiv>
            </FlexDiv>
        </>
    );
}

export default Question;
