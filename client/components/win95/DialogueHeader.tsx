import * as React from 'react';
import styled from 'styled-components';

import { theme, FlexDiv } from '../../style';

type HeaderProps = {
    header: string,
    iconSrc?: string
}

const StyledDialogueHeaderBackground = styled(FlexDiv)`
    background-color: ${theme.colors.win95.blue.main};
    box-sizing: border-box;
    color: white;
    padding: 5px;
    margin-bottom: 5px;
    font-size: 1.2em;
    & img {
        height: 20px;
        width: 20px;
    }
    & div {
        padding-left: 7px;
    }
`;

const DialogueHeader:React.FC<HeaderProps> = ({ header, iconSrc }) => (
    <StyledDialogueHeaderBackground 
        flexDirection={'row'}
        alignItems={'center'}
    >
        {iconSrc && <img src={iconSrc} />}
        <div>{header}</div>
    </StyledDialogueHeaderBackground>
);

export default DialogueHeader;



