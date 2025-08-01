// Model type definitions
// Add custom model interfaces here as needed

export interface BaseModel {
  _id: string;
  createdAt: Date;
  updatedAt: Date;
}

// thêm các interface mô hình khác tại đây
// Example:
// export interface User extends BaseModel {
//   email: string;
//   password: string;
//   name: string;
// }