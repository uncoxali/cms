"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../utils/auth");
const ai_controller_1 = require("../controllers/ai.controller");
const router = (0, express_1.Router)();
router.post('/chat', auth_1.requireAuth, ai_controller_1.chatCompletion);
exports.default = router;
//# sourceMappingURL=ai.routes.js.map