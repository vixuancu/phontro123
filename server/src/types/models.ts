// Model type definitions
// Add custom model interfaces here as needed

export interface BaseModel {
  _id: string;
  createdAt: Date;
  updatedAt: Date;
}

// Add specific model interfaces here as you migrate
// Example:
// export interface User extends BaseModel {
//   email: string;
//   password: string;
//   name: string;
// }