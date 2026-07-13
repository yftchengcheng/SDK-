<template>
  <div class="page-shell">
    <div class="page-header">
      <div class="page-header-left">
        <div class="page-header-icon"><el-icon><Connection /></el-icon></div>
        <div class="page-header-titles">
          <h1 class="page-header-title">广告平台</h1>
          <p class="page-header-subtitle">管理预置与自定义广告平台、账号凭证与 Adapter 接入</p>
        </div>
      </div>
    </div>

    <el-tabs v-model="activeTab" class="network-tabs">
      <!-- 广告平台账号 Tab（第一 Tab） -->
      <el-tab-pane label="广告平台账号" name="accounts">
        <div class="tab-toolbar-info">
          <el-text type="info" size="small">
            管理各广告平台的账号凭证，选择平台后按平台 schema 填写专属字段
          </el-text>
        </div>
        <NetworkAccountManager />
      </el-tab-pane>

      <!-- 自定义广告平台 Tab -->
      <el-tab-pane label="自定义广告平台" name="custom">
        <div class="page-filter">
          <div class="page-filter-form"></div>
          <div class="page-filter-actions">
            <el-button type="primary" :icon="Plus" @click="openCustomDrawer">创建自定义广告平台</el-button>
          </div>
        </div>

        <div class="page-card"><div class="page-table-wrap">
          <div class="page-card-header"><div class="page-card-title">自定义广告平台</div></div>
          <el-table :data="customNetworks" v-loading="loading" stripe style="width: 100%; margin-top: 12px">
            <el-table-column prop="network_code" label="平台代码" width="160" />
            <el-table-column label="图标" width="64">
              <template #default="{ row }">
                <div class="network-icon-cell">
                  <img v-if="row.icon_url" :src="row.icon_url" :alt="row.network_name" />
                  <div v-else class="network-icon-cell--empty">
                    <el-icon :size="16" color="#94A3B8"><Picture /></el-icon>
                  </div>
                </div>
              </template>
            </el-table-column>
            <el-table-column prop="network_name" label="平台名称" min-width="140" />
            <el-table-column label="系统" width="100">
              <template #default="{ row }">
                <el-tag v-if="row.system_type === 1" type="success" size="small">Android</el-tag>
                <el-tag v-else-if="row.system_type === 2" type="warning" size="small">iOS</el-tag>
                <el-tag v-else type="info" size="small">通用</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="supports_bidding" label="支持Bidding" width="120">
              <template #default="{ row }">{{ row.supports_bidding ? '是' : '否' }}</template>
            </el-table-column>
            <el-table-column prop="status" label="状态" width="80">
              <template #default="{ row }">
                <span class="status-tag" :class="row.status === 1 ? 'status-tag--active' : 'status-tag--paused'">{{ row.status === 1 ? '启用' : '禁用' }}</span>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="280" fixed="right">
              <template #default="{ row }">
                <div class="cell-actions"><el-button link type="primary" @click="openAdapterManager(row)">Adapter</el-button><el-button link type="primary" @click="openAppBinding(row)">应用</el-button><el-button link type="primary" @click="handleEdit(row)">编辑</el-button><el-button link type="danger" @click="handleDelete(row)">删除</el-button></div>
              </template>
            </el-table-column>
          </el-table></div></div>
      </el-tab-pane>
    </el-tabs>

    <!-- Drawer: Create / Edit Custom Network（侧边抽屉，保留列表上下文） -->
    <el-drawer
      v-model="customDrawerVisible"
      direction="rtl"
      :size="drawerSizeLg"
      :with-header="false"
      :destroy-on-close="false"
      :append-to-body="true"
      :modal="true"
      :modal-class="'page-form-drawer-mask'"
      class="page-form-drawer"
    >
      <div class="page-form-shell page-form-drawer-shell">
        <header class="page-form-header">
          <div class="page-form-header-titles">
            <h1 class="page-form-header-title">
              <el-icon :size="20" style="color: var(--color-primary-500, #2563EB);">
                <component :is="isEdit ? Edit : Plus" />
              </el-icon>
              <span>{{ isEdit ? '编辑自定义广告平台' : '创建自定义广告平台' }}</span>
              <el-tag v-if="isEdit" type="warning" effect="light" size="small">编辑模式</el-tag>
            </h1>
            <p class="page-form-header-subtitle">
              {{ isEdit ? '修改自定义广告平台信息，保存后立即生效' : '创建一个新的自定义广告平台，配置 Adapter 类名' }}
            </p>
          </div>
          <div class="page-form-header-actions">
            <el-button :icon="RefreshLeft" @click="onFormReset">重置</el-button>
            <el-button :icon="Close" circle plain @click="closeDrawer" />
          </div>
        </header>

        <div class="page-form-body">
          <el-form
            ref="formRef"
            :model="editForm"
            :rules="formRules"
            label-position="top"
            @submit.prevent
          >
            <!-- 区块 1：基础信息 -->
            <section class="page-form-section">
              <div class="page-form-section-header">
                <h2 class="page-form-section-title">
                  <el-icon><Connection /></el-icon>
                  <span>基础信息</span>
                </h2>
              </div>
              <p class="page-form-section-desc">平台名称、唯一代码</p>

              <div class="page-form-grid">
                <el-form-item label="平台名称" prop="network_name" class="span-2">
                  <template #label><span class="required-mark">*</span><span>平台名称</span></template>
                  <el-input v-model="editForm.network_name" placeholder="如 MyAdNetwork" />
                </el-form-item>
                <el-form-item label="平台代码" prop="network_code" class="span-2">
                  <template #label><span class="required-mark">*</span><span>平台代码</span></template>
                  <el-input v-model="editForm.network_code" placeholder="如 MYAD（不输 CUSTOM_ 前缀则自动补全）" :disabled="!!editForm.id" />
                  <div class="form-help">大写字母 + 数字 + 下划线，3-32 位；不与系统预置代码冲突；创建后不可修改</div>
                </el-form-item>
                <el-form-item label="平台图标" class="span-2">
                  <div class="network-icon-uploader">
                    <div class="network-icon-preview" :class="{ 'network-icon-preview--empty': !editForm.icon_url }" @click="openIconFilePicker">
                      <img v-if="editForm.icon_url" :src="editForm.icon_url" alt="icon" />
                      <el-icon v-else :size="28" color="#94A3B8"><Picture /></el-icon>
                      <div v-if="iconUploading" class="network-icon-mask">
                        <el-icon class="is-loading" :size="20" color="#fff"><Loading /></el-icon>
                        <span>上传中</span>
                      </div>
                    </div>
                    <div class="network-icon-actions">
                      <input ref="iconFileInputRef" type="file" accept="image/png" style="display:none" @change="onIconFileChange" />
                      <el-button :icon="UploadFilled" :loading="iconUploading" @click="openIconFilePicker">选择 PNG</el-button>
                      <el-button v-if="editForm.icon_url" :icon="Delete" link type="danger" @click="clearIcon">清除</el-button>
                      <div class="form-help">仅支持 png 格式，文件大小不超过 2MB；用于列表与 SDK 配置展示</div>
                    </div>
                  </div>
                </el-form-item>
                <el-form-item label="系统类型" class="span-2">
                  <div class="system-type-display">
                    <el-tag v-if="derivedSystemType === 'both'" type="info" size="small">Android + iOS</el-tag>
                    <el-tag v-else-if="derivedSystemType === 'android'" type="success" size="small">仅 Android</el-tag>
                    <el-tag v-else-if="derivedSystemType === 'ios'" type="warning" size="small">仅 iOS</el-tag>
                    <el-tag v-else type="danger" size="small">未配置</el-tag>
                    <span class="system-type-hint">由下方 Adapter 类名自动推导（已填初始化 Adapter 的系统）</span>
                  </div>
                </el-form-item>
              </div>
            </section>

            <!-- 区块 2：Adapter 类名（per-system：每个系统一套） -->
            <section class="page-form-section">
              <div class="page-form-section-header">
                <h2 class="page-form-section-title">
                  <el-icon><Box /></el-icon>
                  <span>Adapter 类名</span>
                </h2>
                <span class="page-form-section-tag">每系统独立配置，至少一个系统填写「初始化 Adapter」</span>
              </div>
              <p class="page-form-section-desc">
                格式：<code>包路径.类名</code>（反向域名 + PascalCase）。
                示例：<code>com.myadapter.MyCustomInitAdapter</code>。
                客户端 SDK 通过 <code>Class.forName()</code> 反射加载。
              </p>

              <el-row :gutter="20">
                <!-- Android 列 -->
                <el-col :span="12">
                  <div class="adapter-col adapter-col--android">
                    <div class="adapter-col-header">
                      <el-tag type="success" size="small" effect="dark">Android</el-tag>
                      <span class="adapter-col-hint">Java / Kotlin</span>
                    </div>
                    <el-form-item
                      :prop="`adapter_class_init_android`"
                      :rules="formRules.adapter_class_init_android"
                    >
                      <template #label><span class="required-mark">*</span><span>初始化 Adapter</span></template>
                      <el-input
                        v-model="editForm.adapter_class_init_android"
                        placeholder="如 com.myadapter.MyCustomInitAdapter"
                      />
                      <div class="form-help">App 启动时 SDK 反射加载</div>
                    </el-form-item>
                    <el-form-item
                      :prop="`adapter_class_banner_android`"
                      :rules="formRules.adapter_class_other"
                    >
                      <template #label><span>Banner Adapter</span></template>
                      <el-input v-model="editForm.adapter_class_banner_android" placeholder="选填，如 com.myadapter.MyBannerAdapter" />
                    </el-form-item>
                    <el-form-item
                      :prop="`adapter_class_interstitial_android`"
                      :rules="formRules.adapter_class_other"
                    >
                      <template #label><span>插屏 Adapter</span></template>
                      <el-input v-model="editForm.adapter_class_interstitial_android" placeholder="选填，如 com.myadapter.MyInterstitialAdapter" />
                    </el-form-item>
                    <el-form-item
                      :prop="`adapter_class_rewarded_android`"
                      :rules="formRules.adapter_class_other"
                    >
                      <template #label><span>激励视频 Adapter</span></template>
                      <el-input v-model="editForm.adapter_class_rewarded_android" placeholder="选填，如 com.myadapter.MyRewardedAdapter" />
                    </el-form-item>
                    <el-form-item
                      :prop="`adapter_class_native_android`"
                      :rules="formRules.adapter_class_other"
                    >
                      <template #label><span>原生 Adapter</span></template>
                      <el-input v-model="editForm.adapter_class_native_android" placeholder="选填，如 com.myadapter.MyNativeAdapter" />
                    </el-form-item>
                    <el-form-item
                      :prop="`adapter_class_splash_android`"
                      :rules="formRules.adapter_class_other"
                    >
                      <template #label><span>开屏 Adapter</span></template>
                      <el-input v-model="editForm.adapter_class_splash_android" placeholder="选填，如 com.myadapter.MySplashAdapter" />
                    </el-form-item>
                  </div>
                </el-col>

                <!-- iOS 列 -->
                <el-col :span="12">
                  <div class="adapter-col adapter-col--ios">
                    <div class="adapter-col-header">
                      <el-tag type="warning" size="small" effect="dark">iOS</el-tag>
                      <span class="adapter-col-hint">Objective-C / Swift</span>
                    </div>
                    <el-form-item
                      :prop="`adapter_class_init_ios`"
                      :rules="formRules.adapter_class_init_ios"
                    >
                      <template #label><span class="required-mark">*</span><span>初始化 Adapter</span></template>
                      <el-input
                        v-model="editForm.adapter_class_init_ios"
                        placeholder="如 com.myadapter.MyCustomInitAdapter"
                      />
                      <div class="form-help">App 启动时 SDK 反射加载</div>
                    </el-form-item>
                    <el-form-item
                      :prop="`adapter_class_banner_ios`"
                      :rules="formRules.adapter_class_other"
                    >
                      <template #label><span>Banner Adapter</span></template>
                      <el-input v-model="editForm.adapter_class_banner_ios" placeholder="选填，如 com.myadapter.MyBannerAdapter" />
                    </el-form-item>
                    <el-form-item
                      :prop="`adapter_class_interstitial_ios`"
                      :rules="formRules.adapter_class_other"
                    >
                      <template #label><span>插屏 Adapter</span></template>
                      <el-input v-model="editForm.adapter_class_interstitial_ios" placeholder="选填，如 com.myadapter.MyInterstitialAdapter" />
                    </el-form-item>
                    <el-form-item
                      :prop="`adapter_class_rewarded_ios`"
                      :rules="formRules.adapter_class_other"
                    >
                      <template #label><span>激励视频 Adapter</span></template>
                      <el-input v-model="editForm.adapter_class_rewarded_ios" placeholder="选填，如 com.myadapter.MyRewardedAdapter" />
                    </el-form-item>
                    <el-form-item
                      :prop="`adapter_class_native_ios`"
                      :rules="formRules.adapter_class_other"
                    >
                      <template #label><span>原生 Adapter</span></template>
                      <el-input v-model="editForm.adapter_class_native_ios" placeholder="选填，如 com.myadapter.MyNativeAdapter" />
                    </el-form-item>
                    <el-form-item
                      :prop="`adapter_class_splash_ios`"
                      :rules="formRules.adapter_class_other"
                    >
                      <template #label><span>开屏 Adapter</span></template>
                      <el-input v-model="editForm.adapter_class_splash_ios" placeholder="选填，如 com.myadapter.MySplashAdapter" />
                    </el-form-item>
                  </div>
                </el-col>
              </el-row>

              <div class="adapter-cross-tip">
                <el-icon><InfoFilled /></el-icon>
                <span>两个系统都填写则同时适配 Android + iOS；只填一个系统则仅适配该系统。客户端 SDK 会按 App 平台自动下发对应系统的 Adapter 类名。</span>
              </div>
            </section>

            <!-- 区块 3：高级设置 -->
            <section class="page-form-section">
              <div class="page-form-section-header">
                <h2 class="page-form-section-title">
                  <el-icon><Setting /></el-icon>
                  <span>高级设置</span>
                </h2>
              </div>

              <div class="page-form-grid">
                <el-form-item label="支持 Bidding" class="span-2">
                  <el-switch v-model="editForm.supports_bidding" />
                  <div class="form-help">开启后此平台会参与竞价排序，否则只按瀑布流优先级出价</div>
                </el-form-item>
              </div>
            </section>
          </el-form>
        </div>

        <footer class="page-form-footer">
          <div class="page-form-footer-left">
            <el-icon><InfoFilled /></el-icon>
            <span>带 * 为必填项</span>
          </div>
          <div class="page-form-footer-right">
            <el-button :icon="Close" @click="closeDrawer">取消</el-button>
            <el-button type="primary" :loading="submitting" :icon="Check" @click="handleSubmit">
              {{ isEdit ? '保存修改' : '创建自定义广告平台' }}
            </el-button>
          </div>
        </footer>
      </div>
    </el-drawer>

    <!-- Drawer: Adapter Version Manager -->
    <el-drawer
      v-model="adapterDialog.show"
      direction="rtl"
      :size="drawerSizeLg"
      :with-header="false"
      :destroy-on-close="false"
      :append-to-body="true"
      :modal="true"
      :modal-class="'page-form-drawer-mask'"
      class="page-form-drawer"
    >
      <div class="page-form-shell page-form-drawer-shell">
        <header class="page-form-header">
          <div class="page-form-header-titles">
            <h1 class="page-form-header-title">
              <el-icon :size="20" style="color: var(--color-primary-500, #2563EB);"><Box /></el-icon>
              <span>Adapter 版本管理</span>
              <el-tag type="info" effect="light" size="small">{{ adapterDialog.networkName }}</el-tag>
            </h1>
            <p class="page-form-header-subtitle">上传新版本后需要平台审核通过才会上线</p>
          </div>
          <div class="page-form-header-actions">
            <el-button type="primary" :icon="UploadFilled" @click="openAdapterUpload">上传新版本</el-button>
            <el-button :icon="Close" circle plain @click="adapterDialog.show = false" />
          </div>
        </header>

        <div class="page-form-body">
          <ReviewPanel
            :versions="adapterDialog.versions"
            :loading="adapterDialog.loading"
            @review="handleReviewEvent"
            @download="downloadAdapter"
            @delete="deleteAdapter"
          />
        </div>
      </div>
    </el-drawer>

    <!-- Drawer: Upload Adapter -->
    <el-drawer
      v-model="uploadDialog.show"
      direction="rtl"
      :size="drawerSize"
      :with-header="false"
      :destroy-on-close="false"
      :append-to-body="true"
      :modal="true"
      :modal-class="'page-form-drawer-mask'"
      class="page-form-drawer"
    >
      <div class="page-form-shell page-form-drawer-shell">
        <header class="page-form-header">
          <div class="page-form-header-titles">
            <h1 class="page-form-header-title">
              <el-icon :size="20" style="color: var(--color-primary-500, #2563EB);"><UploadFilled /></el-icon>
              <span>上传 Adapter</span>
              <el-tag type="info" effect="light" size="small">{{ adapterDialog.networkName }}</el-tag>
            </h1>
            <p class="page-form-header-subtitle">填写版本信息、文件信息与变更说明</p>
          </div>
          <div class="page-form-header-actions">
            <el-button :icon="RefreshLeft" @click="onUploadReset">重置</el-button>
            <el-button :icon="Close" circle plain @click="uploadDialog.show = false" />
          </div>
        </header>

        <div class="page-form-body">
          <el-form :model="uploadDialog.form" label-position="top" @submit.prevent>
            <!-- 区块 1：版本信息 -->
            <section class="page-form-section">
              <div class="page-form-section-header">
                <h2 class="page-form-section-title">
                  <el-icon><InfoFilled /></el-icon>
                  <span>版本信息</span>
                </h2>
              </div>

              <div class="page-form-grid">
                <el-form-item label="版本号" class="span-2" required>
                  <template #label><span class="required-mark">*</span><span>版本号</span></template>
                  <el-input v-model="uploadDialog.form.version" placeholder="如 1.0.0" />
                </el-form-item>
                <el-form-item label="Adapter 类型" class="span-2" required>
                  <template #label><span class="required-mark">*</span><span>Adapter 类型</span></template>
                  <el-select v-model="uploadDialog.form.adapter_type" placeholder="选择类型" style="width: 100%">
                    <el-option label="初始化" :value="1" />
                    <el-option label="Banner" :value="2" />
                    <el-option label="插屏" :value="3" />
                    <el-option label="激励视频" :value="4" />
                    <el-option label="原生" :value="5" />
                    <el-option label="开屏" :value="6" />
                  </el-select>
                </el-form-item>
              </div>
            </section>

            <!-- 区块 2：文件信息 -->
            <section class="page-form-section">
              <div class="page-form-section-header">
                <h2 class="page-form-section-title">
                  <el-icon><Document /></el-icon>
                  <span>文件信息</span>
                </h2>
              </div>

              <div class="page-form-grid">
                <el-form-item label="文件名" class="span-2" required>
                  <template #label><span class="required-mark">*</span><span>文件名</span></template>
                  <el-input v-model="uploadDialog.form.file_name" placeholder="文件名（演示用）" />
                </el-form-item>
                <el-form-item label="文件大小" class="span-2">
                  <el-input-number v-model="uploadDialog.form.file_size" :min="0" :max="100000000" style="width: 100%" controls-position="right" />
                </el-form-item>
                <el-form-item label="文件内容" class="span-2">
                  <el-input v-model="uploadDialog.form.file_content" type="textarea" :rows="3" placeholder="实际项目中上传文件二进制（base64编码），演示可填描述" />
                  <div class="form-help">演示环境下可填写描述性内容</div>
                </el-form-item>
                <el-form-item label="变更说明" class="span-2">
                  <el-input v-model="uploadDialog.form.remark" type="textarea" :rows="2" placeholder="本次版本变更说明" />
                </el-form-item>
              </div>
            </section>
          </el-form>
        </div>

        <footer class="page-form-footer">
          <div class="page-form-footer-left">
            <el-icon><InfoFilled /></el-icon>
            <span>带 * 为必填项</span>
          </div>
          <div class="page-form-footer-right">
            <el-button :icon="Close" @click="uploadDialog.show = false">取消</el-button>
            <el-button type="primary" :icon="Check" @click="submitAdapter">提交上传</el-button>
          </div>
        </footer>
      </div>
    </el-drawer>

    <!-- Drawer: App Binding -->
    <el-drawer
      v-model="bindingDialog.show"
      direction="rtl"
      :size="drawerSizeLg"
      :with-header="false"
      :destroy-on-close="false"
      :append-to-body="true"
      :modal="true"
      :modal-class="'page-form-drawer-mask'"
      class="page-form-drawer"
    >
      <div class="page-form-shell page-form-drawer-shell">
        <header class="page-form-header">
          <div class="page-form-header-titles">
            <h1 class="page-form-header-title">
              <el-icon :size="20" style="color: var(--color-primary-500, #2563EB);"><Connection /></el-icon>
              <span>应用关联</span>
              <el-tag type="info" effect="light" size="small">{{ bindingDialog.networkName }}</el-tag>
            </h1>
            <p class="page-form-header-subtitle">为不同应用配置独立的平台凭证和 Adapter 版本</p>
          </div>
          <div class="page-form-header-actions">
            <el-button type="primary" :icon="Plus" @click="openBinding">新增关联</el-button>
            <el-button :icon="Close" circle plain @click="bindingDialog.show = false" />
          </div>
        </header>

        <div class="page-form-body">
          <el-table :data="bindingDialog.bindings" v-loading="bindingDialog.loading" stripe>
            <el-table-column prop="app_key" label="应用" min-width="160" />
            <el-table-column prop="network_app_id" label="平台 AppId" min-width="160" />
            <el-table-column prop="adapter_version_id" label="Adapter 版本" width="140">
              <template #default="{ row }">
                <span v-if="row.adapter_version_id">v{{ findAdapterVersion(row.adapter_version_id) }}</span>
                <span v-else class="cell-muted">未指定</span>
              </template>
            </el-table-column>
            <el-table-column prop="extra_params" label="额外参数" min-width="160" show-overflow-tooltip />
            <el-table-column prop="created_at" label="创建时间" width="170">
              <template #default="{ row }">{{ formatDate(row.created_at) }}</template>
            </el-table-column>
            <el-table-column label="操作" width="100" fixed="right">
              <template #default="{ row }">
                <el-button link type="danger" size="small" @click="unbindNetwork(row)">解绑</el-button>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </div>
    </el-drawer>

    <!-- Drawer: New App Binding -->
    <el-drawer
      v-model="newBindingDialog.show"
      direction="rtl"
      :size="drawerSize"
      :with-header="false"
      :destroy-on-close="false"
      :append-to-body="true"
      :modal="true"
      :modal-class="'page-form-drawer-mask'"
      class="page-form-drawer"
    >
      <div class="page-form-shell page-form-drawer-shell">
        <header class="page-form-header">
          <div class="page-form-header-titles">
            <h1 class="page-form-header-title">
              <el-icon :size="20" style="color: var(--color-primary-500, #2563EB);"><Plus /></el-icon>
              <span>新增应用关联</span>
              <el-tag type="info" effect="light" size="small">{{ bindingDialog.networkName }}</el-tag>
            </h1>
            <p class="page-form-header-subtitle">为该平台选择应用、配置 AppId 和 Adapter 版本</p>
          </div>
          <div class="page-form-header-actions">
            <el-button :icon="RefreshLeft" @click="onBindingReset">重置</el-button>
            <el-button :icon="Close" circle plain @click="newBindingDialog.show = false" />
          </div>
        </header>

        <div class="page-form-body">
          <el-form :model="newBindingDialog.form" label-position="top" @submit.prevent>
            <!-- 区块 1：应用与凭证 -->
            <section class="page-form-section">
              <div class="page-form-section-header">
                <h2 class="page-form-section-title">
                  <el-icon><Cellphone /></el-icon>
                  <span>应用与凭证</span>
                </h2>
              </div>

              <div class="page-form-grid">
                <el-form-item label="选择应用" class="span-2" required>
                  <template #label><span class="required-mark">*</span><span>选择应用</span></template>
                  <el-select v-model="newBindingDialog.form.app_key" placeholder="选择应用" style="width: 100%" filterable>
                    <el-option v-for="app in appList" :key="app.app_key" :label="`${app.app_name} (${app.app_key})`" :value="app.app_key" />
                  </el-select>
                </el-form-item>
                <el-form-item label="平台 AppId" class="span-2" required>
                  <template #label><span class="required-mark">*</span><span>平台 AppId</span></template>
                  <el-input v-model="newBindingDialog.form.network_app_id" placeholder="该平台为此应用分配的 AppId" />
                </el-form-item>
              </div>
            </section>

            <!-- 区块 2：Adapter 配置 -->
            <section class="page-form-section">
              <div class="page-form-section-header">
                <h2 class="page-form-section-title">
                  <el-icon><Box /></el-icon>
                  <span>Adapter 配置</span>
                </h2>
              </div>

              <div class="page-form-grid">
                <el-form-item label="Adapter 版本" class="span-2">
                  <el-select v-model="newBindingDialog.form.adapter_version_id" placeholder="选择 Adapter 版本（默认不指定）" style="width: 100%" clearable>
                    <el-option v-for="v in adapterDialog.versions" :key="v.id" :label="`v${v.version} (${typeLabel(v.adapter_type)})`" :value="v.id" />
                  </el-select>
                  <div class="form-help">不指定时使用该 Adapter 类型的最新通过版本</div>
                </el-form-item>
                <el-form-item label="额外参数" class="span-2">
                  <el-input v-model="newBindingDialog.form.extra_params" type="textarea" :rows="2" placeholder='JSON 格式，如 {"timeout": 5000}' />
                </el-form-item>
              </div>
            </section>
          </el-form>
        </div>

        <footer class="page-form-footer">
          <div class="page-form-footer-left">
            <el-icon><InfoFilled /></el-icon>
            <span>带 * 为必填项</span>
          </div>
          <div class="page-form-footer-right">
            <el-button :icon="Close" @click="newBindingDialog.show = false">取消</el-button>
            <el-button type="primary" :icon="Check" @click="submitBinding">提交关联</el-button>
          </div>
        </footer>
      </div>
    </el-drawer>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue';
import request from '../../utils/request';
import { ElMessage, ElMessageBox } from 'element-plus';
import type { FormInstance, FormRules } from 'element-plus';
import { Plus, Connection, Search, RefreshLeft, UploadFilled, Filter, Edit, InfoFilled, Box, Document, Cellphone, Setting, Close, Check, Picture, Delete, Loading } from '@element-plus/icons-vue';
import NetworkAccountManager from '../../components/NetworkAccountManager.vue';
import ReviewPanel, { type AdapterVersion } from '../../components/ReviewPanel.vue';

const activeTab = ref<'accounts' | 'custom'>('accounts');

const loading = ref(false);
const allNetworks = ref<any[]>([]);
const appList = ref<any[]>([]);

const customNetworks = computed(() => allNetworks.value.filter(n => !n.is_preset));

const customDrawerVisible = ref(false);
const drawerSize = '720px';
const drawerSizeLg = '880px';
const isEdit = ref(false);
const submitting = ref(false);
const formRef = ref<FormInstance>();
// per-system Adapter 字段：6 个类型 × 2 个系统 = 12 个
//   init 必填至少一个（系统类型由这两个 init 字段是否填写自动推导）
const defaultForm = {
  id: 0, network_name: '', network_code: '',
  icon_url: '', // 自定义广告平台图标 URL（PNG），由上传接口返回
  // Android
  adapter_class_init_android: '',
  adapter_class_banner_android: '',
  adapter_class_interstitial_android: '',
  adapter_class_rewarded_android: '',
  adapter_class_native_android: '',
  adapter_class_splash_android: '',
  // iOS
  adapter_class_init_ios: '',
  adapter_class_banner_ios: '',
  adapter_class_interstitial_ios: '',
  adapter_class_rewarded_ios: '',
  adapter_class_native_ios: '',
  adapter_class_splash_ios: '',
  supports_bidding: false,
};
const editForm = reactive({ ...defaultForm });

// ========== 图标上传相关 ==========
const iconUploading = ref(false);
const iconFileInputRef = ref<HTMLInputElement | null>(null);
const ICON_MAX_SIZE = 2 * 1024 * 1024; // 2MB

const openIconFilePicker = () => {
  iconFileInputRef.value?.click();
};

const onIconFileChange = async (e: Event) => {
  const input = e.target as HTMLInputElement;
  const file = input.files?.[0];
  // 立即清空 value 以便重复选择同一文件
  input.value = '';
  if (!file) return;

  // 客户端预检：MIME + magic bytes
  if (file.type !== 'image/png') {
    ElMessage.error('仅支持 png 格式，请上传 png 图片');
    return;
  }
  if (file.size > ICON_MAX_SIZE) {
    ElMessage.error(`图标大小不能超过 ${ICON_MAX_SIZE / 1024 / 1024}MB`);
    return;
  }
  if (file.size === 0) {
    ElMessage.error('图标数据为空');
    return;
  }

  iconUploading.value = true;
  try {
    const dataUrl = await readFileAsDataUrl(file);
    const { data } = await request.post<{ key: string; iconUrl: string }>('/api/v1/console/network/custom/upload-icon', {
      dataUrl,
      networkDefId: editForm.id || undefined,
    });
    editForm.icon_url = data.iconUrl;
    ElMessage.success('图标上传成功');
  } catch (err: any) {
    const msg = err?.response?.data?.message || err?.message || '图标上传失败';
    ElMessage.error(msg);
  } finally {
    iconUploading.value = false;
  }
};

const clearIcon = () => {
  editForm.icon_url = '';
  ElMessage.info('已清除图标，保存后生效');
};

const readFileAsDataUrl = (file: File): Promise<string> => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.onload = () => resolve(String(reader.result || ''));
  reader.onerror = () => reject(new Error('文件读取失败'));
  reader.readAsDataURL(file);
});

// 系统类型自动推导：基于 init 字段填写情况
//   - 两个都填 → 'both'（保存到 DB 的 system_type=3）
//   - 仅 Android → 'android'（system_type=1）
//   - 仅 iOS → 'ios'（system_type=2）
//   - 都不填 → 'none'（不可保存，前端校验拦截）
const derivedSystemType = computed<'both' | 'android' | 'ios' | 'none'>(() => {
  const hasA = !!(editForm.adapter_class_init_android || '').trim();
  const hasI = !!(editForm.adapter_class_init_ios || '').trim();
  if (hasA && hasI) return 'both';
  if (hasA) return 'android';
  if (hasI) return 'ios';
  return 'none';
});

// Java FQN 校验：包路径小写+下划线+数字，类名 PascalCase
// 例：com.myadapter.MyCustomInitAdapter
const FQN_REGEX = /^[a-z][a-z0-9_]*(\.[a-z][a-z0-9_]*)*\.[A-Z][A-Za-z0-9_]*$/;
const validateFQN = (_rule: any, value: any, callback: any) => {
  if (!value || !value.trim()) { callback(); return; }
  if (!FQN_REGEX.test(value.trim())) {
    callback(new Error('格式错误：应为 包路径.类名（包路径小写+下划线+数字，类名以大写字母开头，如 com.myadapter.MyInit）'));
    return;
  }
  callback();
};

// 至少一个系统的 init 必填校验
const validateInitAtLeastOne = (_rule: any, _value: any, callback: any) => {
  if (derivedSystemType.value === 'none') {
    callback(new Error('Android / iOS 至少需要填写一个「初始化 Adapter」'));
    return;
  }
  callback();
};

const formRules: FormRules = {
  network_name: [{ required: true, message: '请输入平台名称', trigger: 'blur' }],
  // per-system init：单个系统可为空，但至少一个必填
  adapter_class_init_android: [{ validator: validateFQN, trigger: 'blur' }],
  adapter_class_init_ios: [{ validator: validateFQN, trigger: 'blur' }],
  // 其他 5 个 adapter × 2 系统 = 10 个字段共用同一条规则
  adapter_class_other: [{ validator: validateFQN, trigger: 'blur' }],
  // 总校验：在 submit 之前跑一次，强制至少一个 init
  // （使用全表单 validate 时的 hook，prop 上挂这个做 trigger=submit 即可）
  network_code: [
    { required: true, message: '请输入平台代码', trigger: 'blur' },
    {
      validator: (_rule, value, callback) => {
        if (!value) { callback(); return; }
        const upper = value.toUpperCase();
        const stripped = upper.startsWith('CUSTOM_') ? upper.slice(7) : upper;
        if (!/^[A-Z][A-Z0-9_]{2,31}$/.test(stripped)) {
          callback(new Error('格式错误：以大写字母开头，仅含大写字母/数字/下划线，长度 3-32 位'));
          return;
        }
        if (!upper.startsWith('CUSTOM_')) {
          const PRESET = ['CSJ', 'YLH', 'BD', 'GDT', 'KS', 'XM', 'BID'];
          if (PRESET.includes(stripped)) {
            callback(new Error(`"${stripped}" 与系统预置平台代码冲突，请更换或加 CUSTOM_ 前缀`));
            return;
          }
        }
        callback();
      },
      trigger: 'blur',
    },
  ],
};

const fetchList = async () => {
  loading.value = true;
  try { const res: any = await request.get('/api/v1/console/network/list'); allNetworks.value = res.data?.list || []; } catch { /* ignore */ } finally { loading.value = false; }
};

const fetchAppList = async () => {
  try { const res: any = await request.get('/api/v1/console/app/list?pageSize=1000'); appList.value = res.data?.list || []; } catch { /* ignore */ }
};

const openCustomDrawer = () => { isEdit.value = false; Object.assign(editForm, defaultForm); customDrawerVisible.value = true; };

const handleEdit = (row: any) => {
  isEdit.value = true;
  Object.assign(editForm, {
    id: row.id, network_name: row.network_name, network_code: row.network_code,
    icon_url: row.icon_url || '',
    // Android
    adapter_class_init_android: row.adapter_class_init_android || '',
    adapter_class_banner_android: row.adapter_class_banner_android || '',
    adapter_class_interstitial_android: row.adapter_class_interstitial_android || '',
    adapter_class_rewarded_android: row.adapter_class_rewarded_android || '',
    adapter_class_native_android: row.adapter_class_native_android || '',
    adapter_class_splash_android: row.adapter_class_splash_android || '',
    // iOS
    adapter_class_init_ios: row.adapter_class_init_ios || '',
    adapter_class_banner_ios: row.adapter_class_banner_ios || '',
    adapter_class_interstitial_ios: row.adapter_class_interstitial_ios || '',
    adapter_class_rewarded_ios: row.adapter_class_rewarded_ios || '',
    adapter_class_native_ios: row.adapter_class_native_ios || '',
    adapter_class_splash_ios: row.adapter_class_splash_ios || '',
    supports_bidding: !!row.supports_bidding,
  });
  customDrawerVisible.value = true;
};

const closeDrawer = () => { customDrawerVisible.value = false; };
const onFormReset = () => { Object.assign(editForm, defaultForm); };
const onUploadReset = () => { Object.assign(uploadDialog.form, { version: '', adapter_type: 1, file_name: '', file_size: 0, file_content: '', remark: '' }); };
const onBindingReset = () => { Object.assign(newBindingDialog.form, { app_key: '', network_app_id: '', adapter_version_id: null, extra_params: '' }); };

const handleSubmit = async () => {
  // 前置校验：至少一个系统的 init 必填
  if (derivedSystemType.value === 'none') {
    ElMessage.error('Android / iOS 至少需要填写一个「初始化 Adapter」');
    return;
  }
  const valid = await formRef.value?.validate().catch(() => false);
  if (!valid) return;
  submitting.value = true;
  try {
    const code = editForm.network_code.startsWith('CUSTOM_') ? editForm.network_code : `CUSTOM_${editForm.network_code}`;
    // 构造 payload：去掉 id + network_code（用归一化后的 code 替代）；system_type 始终不在表单中（后端自动推导）
    const { id, network_code: _nc, ...rest } = editForm;
    const payload = { ...rest, network_code: code, supports_bidding: editForm.supports_bidding ? 1 : 0 };
    // 清理：空字符串转为 null（避免后端把 "" 当作合法值保留）
    for (const k of Object.keys(payload)) {
      if (k.startsWith('adapter_class_') && (payload as any)[k] === '') {
        (payload as any)[k] = null;
      }
    }
    if (editForm.id) {
      await request.put(`/api/v1/console/network/custom/${editForm.id}`, payload);
      ElMessage.success('更新成功');
    } else {
      await request.post('/api/v1/console/network/custom/create', payload);
      ElMessage.success('创建成功');
    }
    customDrawerVisible.value = false;
    fetchList();
  } catch (e: any) {
    const msg = e?.response?.data?.message || e?.message || '操作失败';
    ElMessage.error(msg);
  } finally { submitting.value = false; }
};

const handleDelete = async (row: any) => {
  await ElMessageBox.confirm(`确定删除自定义广告平台"${row.network_name}"吗？`, '警告', { type: 'error' });
  try {
    await request.delete(`/api/v1/console/network/custom/${row.id}`);
    ElMessage.success('删除成功');
    fetchList();
  } catch (e: any) {
    ElMessage.error(e?.response?.data?.message || '删除失败');
  }
};

// ===== Adapter Manager =====
const adapterDialog = reactive({
  show: false, networkId: 0, networkName: '', loading: false, versions: [] as any[],
});

const typeLabel = (t: number) => ({ 1: '初始化', 2: 'Banner', 3: '插屏', 4: '激励视频', 5: '原生', 6: '开屏' }[t] || '其他');
const formatDate = (d: string) => (d ? new Date(d).toLocaleString('zh-CN') : '-');

const openAdapterManager = async (row: any) => {
  adapterDialog.show = true;
  adapterDialog.networkId = row.id;
  adapterDialog.networkName = row.network_name;
  await fetchAdapterVersions();
};

const fetchAdapterVersions = async () => {
  adapterDialog.loading = true;
  try {
    const res: any = await request.get(`/api/v1/console/network/adapter/list?networkDefId=${adapterDialog.networkId}`);
    adapterDialog.versions = res.data?.list || [];
  } catch { /* ignore */ } finally { adapterDialog.loading = false; }
};

const uploadDialog = reactive({
  show: false,
  form: { version: '', adapter_type: 1, file_name: '', file_size: 0, file_content: '', remark: '' },
});

const openAdapterUpload = () => {
  Object.assign(uploadDialog.form, { version: '', adapter_type: 1, file_name: '', file_size: 0, file_content: '', remark: '' });
  uploadDialog.show = true;
};

const submitAdapter = async () => {
  const f = uploadDialog.form;
  if (!f.version || !f.adapter_type || !f.file_name) {
    ElMessage.warning('请填写版本号、类型和文件名');
    return;
  }
  try {
    await request.post('/api/v1/console/network/adapter/upload', {
      network_def_id: adapterDialog.networkId,
      version: f.version,
      adapter_type: f.adapter_type,
      file_name: f.file_name,
      file_size: f.file_size,
      file_content: f.file_content,
      remark: f.remark,
    });
    ElMessage.success('上传成功，等待审核');
    uploadDialog.show = false;
    await fetchAdapterVersions();
  } catch { /* ignore */ }
};

const downloadAdapter = async (row: any) => {
  try {
    const res: any = await request.get(`/api/v1/console/network/adapter/download/${row.id}`);
    if (res.data?.file_content) {
      const blob = new Blob([res.data.file_content], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = res.data.file_name || `adapter-${row.id}`;
      a.click();
      URL.revokeObjectURL(url);
    } else {
      ElMessage.info('无文件内容可下载');
    }
  } catch { /* ignore */ }
};

const reviewAdapter = async (row: AdapterVersion, status: number, remark = ''): Promise<void> => {
  const action = status === 1 ? '通过' : '拒绝';
  try {
    await request.post(`/api/v1/console/network/adapter/review/${row.id}`, { status, remark });
    ElMessage.success(`已${action}`);
    await fetchAdapterVersions();
  } catch { /* ignore */ }
};

const handleReviewEvent = (payload: { row: AdapterVersion; status: number; remark: string }): void => {
  void reviewAdapter(payload.row, payload.status, payload.remark);
};

const deleteAdapter = async (row: any) => {
  await ElMessageBox.confirm(`确定删除 v${row.version} 吗？`, '警告', { type: 'error' });
  try {
    await request.delete(`/api/v1/console/network/adapter/${row.id}`);
    ElMessage.success('删除成功');
    await fetchAdapterVersions();
  } catch { /* ignore */ }
};

// ===== App Binding =====
const bindingDialog = reactive({
  show: false, networkId: 0, networkName: '', loading: false, bindings: [] as any[],
});

const newBindingDialog = reactive({
  show: false,
  form: { app_key: '', network_app_id: '', adapter_version_id: null as number | null, extra_params: '' },
});

const openAppBinding = async (row: any) => {
  bindingDialog.show = true;
  bindingDialog.networkId = row.id;
  bindingDialog.networkName = row.network_name;
  // 同时加载 adapter 列表供下拉使用
  if (!adapterDialog.versions.length || adapterDialog.networkId !== row.id) {
    adapterDialog.networkId = row.id;
    adapterDialog.networkName = row.network_name;
    await fetchAdapterVersions();
  }
  await fetchBindings();
};

const fetchBindings = async () => {
  bindingDialog.loading = true;
  try {
    const res: any = await request.get(`/api/v1/console/network/app/list?networkDefId=${bindingDialog.networkId}`);
    bindingDialog.bindings = res.data?.list || [];
  } catch { /* ignore */ } finally { bindingDialog.loading = false; }
};

const openBinding = async () => {
  if (!appList.value.length) await fetchAppList();
  Object.assign(newBindingDialog.form, { app_key: '', network_app_id: '', adapter_version_id: null, extra_params: '' });
  newBindingDialog.show = true;
};

const submitBinding = async () => {
  const f = newBindingDialog.form;
  if (!f.app_key || !f.network_app_id) {
    ElMessage.warning('请选择应用并填写平台AppId');
    return;
  }
  try {
    await request.post('/api/v1/console/network/app/bind', {
      appKey: f.app_key,
      networkDefId: bindingDialog.networkId,
      adapterVersionId: f.adapter_version_id,
      networkAppId: f.network_app_id,
      extraParams: f.extra_params || null,
    });
    ElMessage.success('关联成功');
    newBindingDialog.show = false;
    await fetchBindings();
  } catch (e: any) {
    const msg = e?.response?.data?.message || '关联失败';
    ElMessage.error(msg);
  }
};

const unbindNetwork = async (row: any) => {
  await ElMessageBox.confirm(`确定解除 "${row.app_key}" 与此平台的关联吗？`, '警告', { type: 'error' });
  try {
    await request.post('/api/v1/console/network/app/unbind', {
      appKey: row.app_key,
      networkDefId: bindingDialog.networkId,
    });
    ElMessage.success('已解绑');
    await fetchBindings();
  } catch { /* ignore */ }
};

const findAdapterVersion = (id: number) => {
  const v = adapterDialog.versions.find(x => x.id === id);
  return v ? v.version : id;
};

onMounted(() => {
  fetchList();
  fetchAppList();
});
</script>
