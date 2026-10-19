# AgentHarbor

**让多个本机 AI 编程助手围绕同一个目标持续推进，直到经过验证与独立审核。**

AgentHarbor（智能体港湾）是面向个人开发者的开源桌面工作台项目。它希望自动发现本机的 Codex、Claude Code、OpenCode 等工具，安排执行与审核角色，把讨论、改动、测试、返工和交付放在同一个项目工作区里。

**当前是 `0.1.0-alpha.1`：可运行的本地任务引擎和 CLI，桌面界面正在设计，尚无桌面安装包。** 本地任务已支持真实助手执行、验证命令、独立审核和有限轮次的自动返工。它还不是能够永久无人值守地推进任意项目的完整产品。

[English](README.en.md) · [架构](docs/architecture.md) · [路线图](docs/ROADMAP.md) · [测试记录](docs/verification.md) · [Looper 接入](docs/looper.md)

## 为什么做这个项目

单个编程助手能完成一次修改，但“持续推进一个项目”还需要明确目标、保留进度、检查结果、独立审核和处理返工。我们希望用户交代目标与验收标准后，常规修改和质量审核可以继续自动推进，同时随时看清任务为什么还没完成。

AgentHarbor 是独立的桌面项目，与 [agentBridge](https://github.com/otterview-labs/agentBridge) 手机项目分开维护。桌面端计划 Windows、Linux、macOS 共用 Electron + React + TypeScript；本机运行不依赖公共云服务器。跨公网连接手机、远程机器或模型服务仍然需要相应的网络与服务配置。本地运行需要电脑开机，模型访问也取决于所选助手的配置。

## 现在已经能做什么

| 能力 | 当前情况 |
| --- | --- |
| 发现本机工具 | 检查 Codex、Claude Code、OpenCode、Looper、Git 和 GitHub CLI；区分找到程序、版本探测成功与尚未验证的登录状态 |
| 独立任务工作区 | 从干净 Git 仓库创建单独 worktree 和分支，保留用户原有检出目录 |
| 自动执行与返工 | 执行助手修改 → 主机运行预设验证命令 → 独立助手审核；失败后自动把原因交回执行者 |
| 完成判断 | 验证成功、审核结构正确且通过，并且源码未变化，才标为完成 |
| 保存与恢复 | 持久化阶段、轮次、验证输出和审核意见；Ctrl+C 暂停，同一任务 ID 再运行 |
| Looper 适配器 | 显式指定配置调用状态、项目、循环、Issue 执行和 PR 连续审核；不代表已完成整条 PR 自动合并实测 |
| 桌面界面 | 设计阶段；预览图尚未获选，不是已发布界面 |
| OpenCode / Jev | OpenCode 已纳入发现；本地执行适配器与 Jev 审核接入待实现 |

目前本地执行角色支持 **Codex 与 Claude Code**，两者分任构建者和审核者。不同工具也可能配置同一种底层模型，项目不会把“不同 CLI”宣传为“不同模型厂商”。

## 快速开始

需要 Node.js 22.13+、Git，以及已安装并完成登录/模型配置的 Codex 和 Claude Code。当前实机测试环境是 macOS；Windows/Linux 会运行 CI，但原生适配、安装包和真机验证仍在路线图中，尤其是 Windows npm `.cmd` 启动器尚未支持。

```bash
git clone https://github.com/otterview-labs/agentharbor.git
cd agentharbor
npm ci --ignore-scripts
npm run build
node dist/src/cli.js doctor
```

`doctor` 只探测安装和版本，不会偷偷请求模型或把存在可执行文件视为认证成功。模型请求复用所选工具已有的本机配置；不要把 API Key 放进任务 JSON、仓库或聊天记录。

复制并编辑 [examples/mission.json](examples/mission.json)，填入目标仓库的**绝对路径**、目标、验收标准和该项目真正使用的验证命令。目标仓库需要先提交现有修改或使用 git stash 收起修改，示例命令也需要替换成项目实际有效的测试入口。

```bash
node dist/src/cli.js create --file /absolute/path/mission.json
node dist/src/cli.js run --id <上一步返回的任务ID>
node dist/src/cli.js show --id <任务ID>
node dist/src/cli.js list
```

命令运行中会输出当前阶段；最终 JSON 包含工作目录、测试证据与审核结果。返回码 `0` 表示完成，`2` 表示任务仍未完成（暂停、阻塞或预算耗尽），`1` 表示命令输入/运行失败。完成后修改保留在任务 worktree；首版不会自动提交、推送或合并。

默认状态目录是 `~/.agentharbor`；可用 `--home /absolute/state/path` 或 `AGENTHARBOR_HOME` 指定独立目录。任务数据和原始验证输出是本机私有数据，不应提交或公开。创建后保持这个状态目录位置固定，因为任务保存了 worktree 路径。

## 自动推进的实际边界

- 每次运行有时间预算，任务有最多 1–20 轮的预算；达到上限会保留未完成原因，不会无限消耗模型额度。
- 测试失败直接返工；审核拒绝带着具体意见返工；审核报错、输出不符合结构或源码变化会阻塞。
- Ctrl+C 正常暂停后可以继续；中断的轮次计入预算。进程被强杀留下的锁，需要先确认旧进程已退出，再按报错路径移除锁后恢复。
- worktree 用于隔离修改，不是安全容器。预设验证命令是用户授权执行的本机程序；请只运行自己信任的项目与命令。Codex 使用 workspace-write/read-only；Claude 构建者只开放文件读写，审核者只开放读取，验证命令由主机执行。
- 独立审核与测试能减少错误，但不能保证任意需求都正确。首版不包含全天候后台调度、完整分解队列、累计费用预算或自动发布；详见路线图。

## 与 Looper 的关系

[Looper](https://github.com/nexu-io/looper) 提供持续推进 GitHub Issue / PR 的循环执行思路和外部引擎。AgentHarbor 参考其角色分工，通过独立 CLI 适配器复用工作流；本地任务运行时是本仓库的实现。**这不是重命名后的 Looper fork，也不会自动安装或改写用户的 Looper 服务。**

适配契约核对到上游提交 `6abd8ffd3a66762aeb8b583aab1411124fb58e0b`。上游为 MIT；出处与许可见 [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md)。外部引擎未安装时应明确提示，不能把模拟测试说成真实 PR 已走通。

## 开发

```bash
npm run check
npm test
```

测试覆盖真实 Git worktree、持久化与恢复、验证失败返工、审核拒绝返工、错误输出、源码漂移、任务锁、命令超时和参数安全。实时模型测试与离线回归分开记录，CI 不需要模型密钥。欢迎围绕路线图提交 Issue / PR。

MIT License.
