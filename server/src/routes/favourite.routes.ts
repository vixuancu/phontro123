import express from 'express';
const router = express.Router();

import { asyncHandler, authUser, authAdmin } from '../auth/checkAuth';
import controllerFavourite from '../controllers/favourite.controller';

router.post('/api/create-favourite', authUser, asyncHandler(controllerFavourite.createFavourite));
router.post('/api/delete-favourite', authUser, asyncHandler(controllerFavourite.deleteFavourite));
router.get('/api/get-favourite', authUser, asyncHandler(controllerFavourite.getFavourite));

export default router;