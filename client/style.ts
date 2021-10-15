import styled, { createGlobalStyle } from 'styled-components';

export const WIN95_FONT_NAME = 'w95fa';

export const theme = {
	// https://hihayk.github.io/scale
	colors: {
		vaporwave: [
			'#F1B6B3',
			'#E99AAF',
			'#DF82B8',
			'#D46CC8',
			'#b058c6',
			'#804BB1',
			'#563F9C',
			'#343785',
			'#293F6F',
		],
		win95: {
			gray: {
				main: '#C3C7CB',
				light: '#E1E3E5',
				dark: '#A5A9AD',
				darker: '#868A8E',
			},
			blue: {
				main: '#000E7A',
			},
		},
	},
	global: {
		font: {
			family: `${WIN95_FONT_NAME}, monospace`,
			color: 'white',
		},
	},
};

export const GlobalStyle = createGlobalStyle`
    @font-face {
        font-family: '${WIN95_FONT_NAME}';
        src:
             url('/fonts/${WIN95_FONT_NAME}.woff2') format('woff2'),
             url('/fonts/${WIN95_FONT_NAME}.woff') format('woff');
    }
    * {
        box-sizing: border-box;
        margin: 0;
        padding: 0;
    }
    html, body {
        font-family: ${theme.global.font.family};
        color: ${theme.global.font.color};
        box-sizing: border-box;
        margin: 0;
        padding: 0;
        width: 100%;
        height: 100%;
        overflow-x: hidden;
        background: linear-gradient(
            180deg,
            ${theme.colors.vaporwave[8]} 0%,
            ${theme.colors.vaporwave[6]} 37%,
            ${theme.colors.vaporwave[2]} 69%,
            ${theme.colors.vaporwave[0]} 100%
        );
    }
    // Adapted from: https://codepen.io/mtsgeneroso/pen/LYEWBMd
    .screen {
        width: 100%;
        height: 100%;
        background-color: transparent;
        background-size: 4px 4px, 4px 4px;
        background-position:  -1px -1px, -1px -1px;
        background-image: 
            linear-gradient(rgba(255,255,255,.05) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,.05) 1px, transparent 1px);
        z-index: 1;
        position: absolute;
        top: 0;
        left: 0;
        isolation: isolate;
    }
    .glitch {
        position: relative;
        clip-path: polygon(0 0, 100% 0, 100% .5em, 0 .5em);
        animation: glitch 10s linear infinite;
        transform: translatex(.1rem);
    }
    @keyframes glitch {
        to {
            clip-path: polygon(0 calc(100% - .5em), 100% calc(100% - .5em), 0 100%, 0 100%)
        }
    }
    #root {
        width: 100%;
        height: 100%;
        margin: 0 auto;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        z-index: 2;
        position: absolute;
        top: 0;
        left: 0;
    }
`;

export const FlexDiv = styled.div<{
	alignItems?: string;
	justifyContent?: string;
	flexDirection?: string;
}>`
	display: flex;
	${(p) => `align-items: ${p.alignItems};` || ''}
	${(p) => `justify-content: ${p.justifyContent};` || ''}
    ${(p) => `flex-direction: ${p.flexDirection};` || ''}
`;
