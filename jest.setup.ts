import '@testing-library/jest-dom';
import { TextEncoder, TextDecoder } from 'util';
import 'whatwg-fetch';

Object.assign(global, { TextDecoder, TextEncoder });

