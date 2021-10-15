import React from 'react';
import styled, { keyframes } from 'styled-components';

type Props = {
    letter: string;
    delay: string;
    toCaps?: boolean;
};

const BounceKeyframes = keyframes`
    0%   { transform: scale(1,1) translateY(0); }
    10%  { transform: scale(1.1,.9) translateY(0); }
    30%  { transform: scale(.9,1.1) translateY(-20px); }
    50%  { transform: scale(1.05,.95) translateY(0); }
    58%  { transform: scale(1,1) translateY(-7px); }
    65%  { transform: scale(1,1) translateY(0); }
    100% { transform: scale(1,1) translateY(0); }
`;

const ScaleKeyframes = keyframes`
    0% { transform: scaleX(1); }
    25% { transform: scaleX(0.4); }
    50% { transform: scaleX(1); }
    75% { transform: scaleX(0.9); }
    100% { transform: scaleX(1); }
`;

const StyledLetter = styled.div<Pick<Props, 'delay'>>`
    animation: ${BounceKeyframes} 1s ease infinite ${p => p.delay}s;
    -webkit-animation: ${BounceKeyframes} 1s ease infinite ${p => p.delay}s;
    white-space: pre;
    position: relative;
    color: #4cc9f0;
    text-shadow: 0 3px #4361ee, 0 5px #4361ee, 0 7px #4361ee;
    &:before, &:after {
        content: '';
        position: absolute;
        background-color: rgba(255,255,255,0.01);
        width: 50px;
        height: 5px;
        border-radius: 20%;
        top: 40px;
        z-index: -1;
    }
    &:before {
        left: 0;
        animation: ${ScaleKeyframes} 1s linear infinite;
        -webkit-animation: ${ScaleKeyframes} 1s linear infinite;
    }
    &:after {
        left: 57px;
        animation: ${ScaleKeyframes} 1s linear infinite .1s;
        -webkit-animation: ${ScaleKeyframes} 1s linear infinite .1s;
    }
`;
const BouncingLetter:React.FC<Props> = ({ letter, delay, toCaps = false }) => (
    <StyledLetter delay={delay}>
        {toCaps ? letter.toUpperCase() : letter}
    </StyledLetter>
);

export default BouncingLetter;