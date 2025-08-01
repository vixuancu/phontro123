# GitHub Copilot Instructions - Dự án PhongTro123

## 🎯 Ngôn ngữ & Phản hồi

### Phản hồi chính

- **LUÔN** sử dụng tiếng Việt cho mọi phản hồi, chú thích và đề xuất code
- Mọi đoạn code gợi ý phải đi kèm giải thích bằng tiếng Việt
- Tên biến/function có thể tiếng Anh nhưng comment phải tiếng Việt

### Comment trong dự án

- **TẤT CẢ** comment phải bằng tiếng Việt
- Trường hợp thuật ngữ kỹ thuật: sử dụng cả tiếng Việt + tiếng Anh
- Ví dụ: `// Middleware xác thực (Authentication Middleware)`

## 🏗️ Cấu trúc dự án

### Backend (Server)

- **Framework**: Express.js với TypeScript
- **Database**: MongoDB với Mongoose
- **Authentication**: JWT + Cookie-based auth
- **Validation**: Custom error handling
- **File structure**: Models, Controllers, Routes, Services

### Frontend (Client)

- **Framework**: React 18 với Vite
- **UI Library**: Ant Design
- **State Management**: Context API
- **Routing**: React Router DOM v7
- **Styling**: SCSS Modules

## 📝 Coding Standards

### TypeScript Rules

```typescript
// ✅ Đúng - Comment tiếng Việt + Types đầy đủ
/**
 * Middleware xác thực người dùng (User Authentication)
 * @param req - Request object chứa thông tin user
 * @param res - Response object để trả về client
 * @param next - Function chuyển sang middleware tiếp theo
 */
export const authUser = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  // Kiểm tra token trong cookie
  const token = req.cookies.token;

  if (!token) {
    throw new BadUserRequestError("Vui lòng đăng nhập để tiếp tục");
  }
  // ... logic tiếp theo
};

// ❌ Sai - Thiếu comment và types không đầy đủ
export const authUser = async (req: any, res: any, next: any) => {
  const token = req.cookies.token;
  // ...
};
```

### Naming Conventions

- **Functions**: camelCase với động từ tiếng Anh + comment tiếng Việt
- **Variables**: camelCase mô tả rõ ràng + comment tiếng Việt
- **Constants**: UPPER_SNAKE_CASE + comment tiếng Việt
- **Types/Interfaces**: PascalCase + comment tiếng Việt

### Error Handling

```typescript
// ✅ Luôn sử dụng custom error classes với message tiếng Việt
throw new BadRequestError("Email không tồn tại trong hệ thống");
throw new UnauthorizedError("Bạn không có quyền truy cập tính năng này");

// ✅ Try-catch với comment giải thích
try {
  // Thực hiện xử lý logic nghiệp vụ
  const result = await processBusinessLogic();
  return result;
} catch (error) {
  // Log lỗi để debug và chuyển tiếp cho error handler
  console.error("Lỗi xử lý nghiệp vụ:", error);
  next(error);
}
```

## 🎨 Frontend Standards

### React Components

```jsx
// ✅ Component với comment tiếng Việt
/**
 * Component hiển thị danh sách bài đăng (Post List Component)
 * @param {Object} props - Props của component
 * @param {Array} props.posts - Mảng các bài đăng
 * @param {Function} props.onEdit - Callback khi edit bài đăng
 */
const PostList = ({ posts, onEdit }) => {
  // State quản lý trạng thái loading
  const [loading, setLoading] = useState(false);

  // Effect để fetch data khi component mount
  useEffect(() => {
    // Gọi API lấy danh sách bài đăng
    fetchPosts();
  }, []);

  return (
    <div className="post-list">
      {/* Hiển thị danh sách bài đăng */}
      {posts.map((post) => (
        <PostCard key={post.id} post={post} onEdit={onEdit} />
      ))}
    </div>
  );
};
```

### CSS/SCSS

```scss
// ✅ Comment tiếng Việt cho CSS
.post-list {
  // Container chính cho danh sách bài đăng
  display: flex;
  flex-direction: column;
  gap: 16px;

  &__item {
    // Styling cho từng item trong danh sách
    padding: 16px;
    border: 1px solid #e8e8e8;
    border-radius: 8px;

    &:hover {
      // Hiệu ứng khi hover vào item
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }
  }
}
```

## 🔧 Code Generation Rules

### Khi tạo API endpoints:

```typescript
// ✅ Luôn include validation, error handling, và comment đầy đủ
/**
 * API tạo bài đăng mới (Create New Post API)
 * @route POST /api/posts
 * @access Private - Yêu cầu đăng nhập
 */
router.post(
  "/api/posts",
  authUser,
  asyncHandler(async (req: Request, res: Response) => {
    // Destructure và validate dữ liệu từ request body
    const { title, content, price, address } = req.body;

    // Kiểm tra các trường bắt buộc
    if (!title || !content || !price) {
      throw new BadRequestError("Vui lòng nhập đầy đủ thông tin bài đăng");
    }

    // Tạo bài đăng mới với thông tin user từ token
    const newPost = await Post.create({
      title,
      content,
      price,
      address,
      userId: req.user.id, // Lấy từ middleware authUser
      status: "pending", // Trạng thái chờ duyệt
    });

    // Trả về response thành công
    return new Created({
      message: "Tạo bài đăng thành công",
      metadata: newPost,
    }).send(res);
  })
);
```

### Khi tạo Database Models:

```typescript
// ✅ Schema với validation và comment đầy đủ
/**
 * Schema cho bài đăng phòng trọ (Post Schema)
 */
const postSchema = new Schema(
  {
    // Tiêu đề bài đăng
    title: {
      type: String,
      required: [true, "Tiêu đề không được để trống"],
      maxLength: [200, "Tiêu đề không được vượt quá 200 ký tự"],
      trim: true,
    },

    // Nội dung chi tiết bài đăng
    content: {
      type: String,
      required: [true, "Nội dung không được để trống"],
      minLength: [50, "Nội dung phải có ít nhất 50 ký tự"],
    },

    // Giá phòng (VNĐ)
    price: {
      type: Number,
      required: [true, "Giá phòng không được để trống"],
      min: [0, "Giá phòng phải lớn hơn 0"],
    },

    // ID người đăng (tham chiếu tới User)
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "ID người đăng không được để trống"],
    },
  },
  {
    timestamps: true, // Tự động thêm createdAt và updatedAt
  }
);
```

## 🚀 Best Practices Suggestions

### 1. Security First

- Luôn validate input từ client
- Sử dụng middleware authentication cho protected routes
- Hash password và sensitive data
- Implement rate limiting

### 2. Performance Optimization

- Sử dụng MongoDB indexes cho queries thường dùng
- Implement pagination cho danh sách dài
- Cache data khi cần thiết
- Optimize images và static files

### 3. Error Handling

- Tạo custom error classes với message tiếng Việt
- Implement global error handler
- Log errors cho debugging
- Trả về response nhất quán

### 4. Code Organization

- Tách logic thành services riêng biệt
- Sử dụng middleware cho code reuse
- Implement proper TypeScript interfaces
- Maintain clean folder structure

## 📚 Documentation Standards

### JSDoc cho Functions

````typescript
/**
 * Gửi email quên mật khẩu với OTP (Send Forgot Password Email)
 *
 * @description Tạo OTP 6 số và gửi qua email để reset password
 * @param {string} email - Email của user cần reset password
 * @param {string} otp - Mã OTP 6 số được generate
 * @returns {Promise<boolean>} Promise resolve true nếu gửi thành công
 * @throws {BadRequestError} Khi email không hợp lệ hoặc gửi mail thất bại
 *
 * @example
 * ```typescript
 * await sendMailForgotPassword('user@example.com', '123456');
 * ```
 */
export const sendMailForgotPassword = async (
  email: string,
  otp: string
): Promise<boolean> => {
  // Implementation logic here
};
````

Những rules này sẽ giúp GitHub Copilot hiểu và suggest code phù hợp với dự án của bạn!
