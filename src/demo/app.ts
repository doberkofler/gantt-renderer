import {init} from './init.ts';
import './demo-shell.css';

if (document.readyState === 'loading') {
	document.addEventListener('DOMContentLoaded', init);
} else {
	init();
}
