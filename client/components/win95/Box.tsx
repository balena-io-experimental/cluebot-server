import * as React from 'react';
import styled from 'styled-components';

import { theme } from '../../style';

type Props = {
    children: JSX.Element,
    w?: string,
    h?: string,
    isButton?: boolean
}

const OuterBox = styled.div<Omit<Props, 'children'>>`
    background-color: ${theme.colors.win95.gray.main};
    color: black;
    padding: 2px;
    box-shadow: inset 1px 1px 0px 1px ${theme.colors.win95.gray.light},
        inset 0 0 0 1px ${theme.colors.win95.gray.main},
        1px 1px 0 0px black;
    -webkit-user-select: none;
    user-select: none;
    ${p => p.w && `width: ${p.w};`}
    ${p => p.h && `height: ${p.w};`}
    ${p => p.isButton && 
        `
            padding: 7px 20px 5px;
            &:active {
                padding: 8px 20px 4px;
                outline: 1px dotted black;
                outline-offset: -5px;
                box-shadow: inset 0 0 0 1px ${theme.colors.win95.gray.dark},
                    0 0 0 1px black;
            }
            & div {
                text-align: center;
            }
        `
    }
`;

const Box:React.FC<Props> = ({ children, isButton, w, h }) => (
    <OuterBox 
        isButton={isButton}
        w={w}
        h={h}
    >
        {children}
    </OuterBox>
);

export default Box;
