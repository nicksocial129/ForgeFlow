"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sanitizeMiddleware = void 0;
const sanitize_html_1 = __importDefault(require("sanitize-html"));
function sanitizeMiddleware(req, res, next) {
    // decoding is necessary as the url is encoded by the browser
    const decodedURI = decodeURI(req.url);
    req.url = (0, sanitize_html_1.default)(decodedURI);
    for (let p in req.query) {
        if (Array.isArray(req.query[p])) {
            const sanitizedQ = [];
            for (const q of req.query[p]) {
                sanitizedQ.push((0, sanitize_html_1.default)(q));
            }
            req.query[p] = sanitizedQ;
        }
        else {
            req.query[p] = (0, sanitize_html_1.default)(req.query[p]);
        }
    }
    next();
}
exports.sanitizeMiddleware = sanitizeMiddleware;
//# sourceMappingURL=XSS.js.map