# 管理者設定指南

## 步驟 1: 執行資料庫更新

1. 開啟 Supabase Dashboard
2. 前往 SQL Editor
3. 複製並執行以下 SQL：

```sql
-- Add role column to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user';

-- Create index for faster role queries
CREATE INDEX IF NOT EXISTS profiles_role_idx ON profiles(role);
```

## 步驟 2: 設定您的帳號為管理者

在 Supabase SQL Editor 執行（替換成您的 Email）：

```sql
UPDATE profiles 
SET role = 'admin' 
WHERE id = (
  SELECT id 
  FROM auth.users 
  WHERE email = '您的Email@example.com'
);
```

## 步驟 3: 驗證設定

執行以下查詢確認：

```sql
SELECT id, full_name, role 
FROM profiles 
WHERE role = 'admin';
```

應該會看到您的帳號顯示 role = 'admin'

## 步驟 4: 重新登入

1. 登出應用程式
2. 重新登入
3. 您應該會在導覽列看到紅色的 "Admin" 連結

## 疑難排解

### 問題：看不到 Admin 連結
- 確認已執行步驟 1 和 2 的 SQL
- 確認已重新登入
- 檢查瀏覽器 Console 是否有錯誤

### 問題：Manage Bookings 沒有顯示資料
- 確認資料庫中有預約記錄
- 在 Supabase Dashboard → Table Editor → bookings 查看是否有資料
- 檢查瀏覽器 Console 的錯誤訊息

### 問題：Edit Room 出現 404
- 確認已部署最新版本
- 清除瀏覽器快取
- 檢查 URL 格式是否正確：`/admin/rooms/[room-id]`
