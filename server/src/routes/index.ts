import userRoutes from './users.routes';
import postRoutes from './posts.routes';
import paymentsRoutes from './payments.routes';
import messengerRoutes from './messenger.routes';
import favouriteRoutes from './favourite.routes';

import multer from 'multer';
import path from 'path';
import { Application, Request, Response } from 'express';

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'src/uploads/images');
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + path.extname(file.originalname));
    },
});

const upload = multer({ storage: storage });

function routes(app: Application): void {
    app.use('/api', userRoutes);
    app.use('/api', postRoutes);
    app.use('/api', paymentsRoutes);
    app.use('/api', messengerRoutes);
    app.use('/api', favouriteRoutes);

    ///// uploads
    app.post('/api/upload-images', upload.array('images'), (req: Request, res: Response) => {
        const files = req.files as Express.Multer.File[];
        return res.status(200).json({
            message: 'Images uploaded successfully',
            images: files.map((file) => `http://localhost:3000/uploads/images/${file.filename}`),
        });
    });

    app.post('/api/upload-image', upload.single('avatar'), (req: Request, res: Response) => {
        const file = req.file as Express.Multer.File;
        return res.status(200).json({
            message: 'Image uploaded successfully',
            image: `http://localhost:3000/uploads/images/${file.filename}`,
        });
    });
}

export default routes;