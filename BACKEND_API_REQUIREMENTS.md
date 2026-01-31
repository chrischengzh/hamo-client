# Hamo-UME 后端 API 修改需求

## 概述
为了支持一个 Client 可以连接多个 Avatars 的业务需求，后端需要进行以下修改。

---

## 1. 数据库模型修改

### 当前模型（一对一关系）
```python
class Client(Base):
    id: UUID
    email: str
    avatar_id: UUID  # ❌ 单个 avatar_id
    # ... 其他字段
```

### 需要改为（多对多关系）
```python
# 新建关联表
class ClientAvatarConnection(Base):
    __tablename__ = "client_avatar_connections"

    id: UUID = Field(default_factory=uuid4, primary_key=True)
    client_id: UUID = Field(foreign_key="clients.id")
    avatar_id: UUID = Field(foreign_key="avatars.id")
    connected_at: datetime = Field(default_factory=datetime.utcnow)
    last_chat_time: datetime = Field(default_factory=datetime.utcnow)
    is_active: bool = Field(default=True)

    # 关系
    client: Client = Relationship(back_populates="avatar_connections")
    avatar: Avatar = Relationship(back_populates="client_connections")

class Client(Base):
    id: UUID
    email: str
    # 移除 avatar_id 字段
    avatar_connections: List[ClientAvatarConnection] = Relationship(back_populates="client")

class Avatar(Base):
    id: UUID
    name: str
    client_connections: List[ClientAvatarConnection] = Relationship(back_populates="avatar")
```

---

## 2. API 端点修改

### 2.1 修改 Client 登录响应

**端点**: `POST /api/auth/loginClient`

**当前 Response Schema (ClientTokenResponse)**:
```json
{
  "access_token": "string",
  "refresh_token": "string",
  "token_type": "bearer",
  "expires_in": 86400,
  "user": {...},
  "connected_avatar": {  // ❌ 改这里
    "id": "uuid",
    "name": "string",
    "therapist_name": "string"
  }
}
```

**需要改为**:
```json
{
  "access_token": "string",
  "refresh_token": "string",
  "token_type": "bearer",
  "expires_in": 86400,
  "user": {...},
  "connected_avatars": [  // ✅ 改为复数数组
    {
      "id": "uuid",
      "avatar_name": "string",
      "pro_name": "string",
      "theory": "string",
      "specialty": "string",
      "avatar_picture": "string | null",
      "last_chat_time": "2026-01-30T12:00:00Z",
      "welcome_message": "string"
    }
  ]
}
```

**Schema 定义**:
```python
class ConnectedAvatarDetail(BaseModel):
    """详细的已连接 Avatar 信息"""
    id: UUID
    avatar_name: str
    pro_name: str
    theory: str
    specialty: str
    avatar_picture: Optional[str] = None
    last_chat_time: datetime
    welcome_message: Optional[str] = None

class ClientTokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int
    user: ClientResponse
    connected_avatars: List[ConnectedAvatarDetail] = []  # 改为列表
```

---

### 2.2 修改 Client 注册响应

**端点**: `POST /api/auth/registerClient`

**当前响应**: 同上，使用 `ClientTokenResponse`，包含单个 `connected_avatar`

**需要改为**: 使用修改后的 `ClientTokenResponse`，包含 `connected_avatars` 数组

注册时使用邀请码会自动连接到对应的 Avatar，因此 `connected_avatars` 数组应该包含这个 Avatar。

---

### 2.3 新增获取 Client 已连接 Avatars 端点

**端点**: `GET /api/client/avatars`

**描述**: 获取当前 Client 已连接的所有 Avatars

**认证**: Bearer Token (Client role)

**响应**:
```json
[
  {
    "id": "uuid",
    "avatar_name": "string",
    "pro_name": "string",
    "theory": "string",
    "specialty": "string",
    "avatar_picture": "string | null",
    "last_chat_time": "2026-01-30T12:00:00Z",
    "welcome_message": "string"
  }
]
```

**Python 实现示例**:
```python
@router.get("/client/avatars", response_model=List[ConnectedAvatarDetail])
async def get_client_avatars(
    current_user: ClientResponse = Depends(get_current_client)
):
    """
    Get all avatars connected to the current client
    """
    # 从数据库获取所有连接
    connections = await ClientAvatarConnection.filter(
        client_id=current_user.id,
        is_active=True
    ).prefetch_related("avatar", "avatar__therapist")

    # 转换为响应格式
    avatars = []
    for conn in connections:
        avatar = conn.avatar
        therapist = avatar.therapist
        avatars.append(ConnectedAvatarDetail(
            id=avatar.id,
            avatar_name=avatar.name,
            pro_name=therapist.full_name if therapist else "Therapist",
            theory=avatar.theory or "N/A",
            specialty=avatar.specialty or "N/A",
            avatar_picture=avatar.avatar_picture,
            last_chat_time=conn.last_chat_time,
            welcome_message=avatar.welcome_message
        ))

    return avatars
```

---

### 2.4 修改连接 Avatar 的端点

**端点**: `POST /api/client/avatar/connect`

**描述**: 使用邀请码连接新的 Avatar

**当前行为**: 替换现有的单个连接

**需要改为**: 添加新的连接（支持多个）

**Request Body**:
```json
{
  "invitation_code": "HAMO-XXXXX"
}
```

**Response**:
```json
{
  "avatar": {
    "id": "uuid",
    "avatar_name": "string",
    "pro_name": "string",
    "theory": "string",
    "specialty": "string",
    "avatar_picture": "string | null",
    "last_chat_time": "2026-01-30T12:00:00Z",
    "welcome_message": "string"
  }
}
```

**Python 实现逻辑**:
```python
@router.post("/client/avatar/connect")
async def connect_avatar(
    request: InvitationCodeRequest,
    current_user: ClientResponse = Depends(get_current_client)
):
    # 验证邀请码
    invitation = await validate_invitation_code(request.invitation_code)

    # 检查是否已经连接
    existing = await ClientAvatarConnection.filter(
        client_id=current_user.id,
        avatar_id=invitation.avatar_id,
        is_active=True
    ).first()

    if existing:
        raise HTTPException(400, "Already connected to this avatar")

    # 创建新连接（不删除旧连接）
    connection = await ClientAvatarConnection.create(
        client_id=current_user.id,
        avatar_id=invitation.avatar_id,
        connected_at=datetime.utcnow(),
        last_chat_time=datetime.utcnow()
    )

    # 返回新连接的 avatar 详情
    avatar = await get_avatar_details(invitation.avatar_id)
    return {"avatar": avatar}
```

---

## 3. 数据库迁移

### 迁移步骤
1. **创建新表** `client_avatar_connections`
2. **迁移现有数据**：
   ```sql
   INSERT INTO client_avatar_connections (id, client_id, avatar_id, connected_at, last_chat_time)
   SELECT
       gen_random_uuid(),
       id as client_id,
       avatar_id,
       created_at as connected_at,
       updated_at as last_chat_time
   FROM clients
   WHERE avatar_id IS NOT NULL;
   ```
3. **删除旧字段**：`ALTER TABLE clients DROP COLUMN avatar_id;`

---

## 4. 前端调用说明

前端已经修改为使用以下端点：

1. **页面刷新时**: 调用 `GET /api/client/avatars` 获取所有已连接的 avatars
2. **登录时**: 期望 `POST /api/auth/loginClient` 返回 `connected_avatars` 数组
3. **注册时**: 期望 `POST /api/auth/registerClient` 返回 `connected_avatars` 数组
4. **连接新 avatar**: 调用 `POST /api/client/avatar/connect`

---

## 5. 测试建议

### 测试场景
1. **注册新 Client**：应该自动连接邀请码对应的 avatar
2. **登录 Client**：应该返回所有已连接的 avatars
3. **连接第二个 avatar**：使用新邀请码，不应该断开第一个 avatar
4. **页面刷新**：调用 GET /api/client/avatars 应该返回所有 avatars
5. **重复连接**：使用同一个邀请码连接已连接的 avatar 应该返回错误

---

## 6. 兼容性说明

如果需要保持向后兼容，可以：
1. 同时保留 `connected_avatar`（单数）和 `connected_avatars`（复数）
2. `connected_avatar` 返回第一个/最新的 avatar
3. 前端优先使用 `connected_avatars`，如果为空则使用 `connected_avatar`

但建议直接切换到新格式，因为这是内部 API。

---

## 7. 联系方式

如有疑问，请联系前端开发团队或查看前端代码：
- `/src/api.js` - API 调用层
- `/src/App.jsx` - UI 逻辑和数据处理

---

**生成日期**: 2026-01-30
**版本**: 1.3.2-draft
**作者**: Claude Sonnet 4.5
