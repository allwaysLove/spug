/**
 * Copyright (c) OpenSpug Organization. https://github.com/openspug/spug
 * Copyright (c) <spug.dev@gmail.com>
 * Released under the AGPL-3.0 License.
 */
import React, { useEffect, useState } from 'react';
import { observer } from 'mobx-react';
import { Form, Input, Select, Radio, Divider, Button, message } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { ACEditor } from 'components';
import { http, history, hasPermission } from 'libs';
import HostSelector from 'pages/host/Selector';
import credStore from 'pages/system/credential/store';
import css from './index.module.less';

function Build(props) {
  const [form] = Form.useForm()
  const [tips, setTips] = useState()
  const [branches, setBranches] = useState([])

  useEffect(() => {
    checkGit()
    props.setHandler(() => handleSave)
    if (credStore.records.length === 0) credStore.fetchRecords()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function handleSave() {
    const data = form.getFieldsValue()
    if (!data.name) return message.error('请输入节点名称')
    if (!data.condition) return message.error('请选择节点的执行条件')
    if (!data.git_url) return message.error('请输入Git仓库地址')
    if (!data.git_mode) return message.error('请选择构建分支/Tag')
    if (data.git_mode === 'branch') {
      if (!data.git_branch) return message.error('请选择构建分支')
      if (!data.git_commit) return message.error('请选择构建分支规则')
    } else if (!data.git_tag) {
      return message.error('请选择构建Tag规则')
    }
    if (!data.target) return message.error('请选择构建主机')
    if (!data.workspace) return message.error('请输入工作目录')
    if (!data.command) return message.error('请输入构建命令')
    return data
  }

  function checkGit() {
    setTips()
    const data = form.getFieldsValue()
    if (!data.git_url) return
    http.post('/api/credential/check/', {id: data.credential_id, type: 'git', data: data.git_url})
      .then(res => {
        if (res.is_pass) {
          setBranches(res.message)
        } else {
          setTips(res.message)
        }
      })
  }

  return (
    <Form layout="vertical" form={form} initialValues={props.node}>
      <Form.Item required name="name" label="节点名称">
        <Input placeholder="请输入节点名称"/>
      </Form.Item>
      <Form.Item required name="condition" label="执行条件"
                 tooltip="当该节点为流程的起始节点时（无上游节点），该条件将会被忽略。">
        <Radio.Group>
          <Radio.Button value="success">上游执行成功时</Radio.Button>
          <Radio.Button value="error">上游执行失败时</Radio.Button>
          <Radio.Button value="always">总是执行</Radio.Button>
        </Radio.Group>
      </Form.Item>
      <div style={{display: 'flex', justifyContent: 'space-between'}}>
        <Form.Item required name="git_url" label="Git仓库" style={{marginBottom: 0}}>
          <Input placeholder="请输入Git仓库地址" style={{width: 300}} onBlur={checkGit}/>
        </Form.Item>
        <Form.Item name="credential_id" label="访问凭据" style={{marginBottom: 0}}>
          <Select
            allowClear
            placeholder="可选访问凭据"
            style={{width: 140}}
            onChange={checkGit} options={credStore.records.map(x => ({label: `${x.username}(${x.name})`, value: x.id}))}
            dropdownRender={menu => (
              <>
                {menu}
                {hasPermission('system.credential.add') && (
                  <>
                    <Divider style={{margin: '8px 0'}}/>
                    <Button block type="link" icon={<PlusOutlined/>} style={{padding: 0}}
                            onClick={() => history.push('/system/credential')}>添加凭据</Button>
                  </>
                )}
              </>
            )}
          />
        </Form.Item>
      </div>
      <div className={css.formTips}>
        {tips ? (
          <pre className={css.content}>{tips}</pre>
        ) : null}
      </div>
      <Form.Item required label="Git分支/Tag设置"
                 tooltip="最新提交指使用执行发布时最新的一次提交(或Tag)，发布时选择会在执行发布时作为动态参数选择。">
        <Input.Group compact>
          <Form.Item name="git_mode" noStyle>
            <Select style={{width: 100}} placeholder="请选择">
              <Select.Option value="branch">分支</Select.Option>
              <Select.Option value="tag">Tag</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item noStyle shouldUpdate>
            {({getFieldValue}) =>
              getFieldValue('git_mode') === 'branch' ? (
                <React.Fragment>
                  <Form.Item name="git_branch" noStyle>
                    <Select style={{width: 200}} placeholder="请选择">
                      {branches.map(item => (
                        <Select.Option key={item} value={item}>{item}</Select.Option>
                      ))}
                    </Select>
                  </Form.Item>
                  <Form.Item name="git_commit" noStyle>
                    <Select style={{width: 150}} placeholder="请选择">
                      <Select.Option value="selective">发布时选择</Select.Option>
                      <Select.Option value="latest">最新提交</Select.Option>
                    </Select>
                  </Form.Item>
                </React.Fragment>
              ) : (
                <Form.Item name="git_tag" noStyle>
                  <Select style={{width: 200}} placeholder="请选择">
                    <Select.Option value="selective">发布时选择</Select.Option>
                    <Select.Option value="latest">最新提交</Select.Option>
                  </Select>
                </Form.Item>
              )
            }
          </Form.Item>
        </Input.Group>
      </Form.Item>
      <Form.Item required name="target" label="构建主机">
        <HostSelector onlyOne type="button"/>
      </Form.Item>
      <Form.Item required name="workspace" label="工作目录">
        <Input placeholder="请输入工作目录路径"/>
      </Form.Item>
      <Form.Item required name="command" label="构建命令">
        <ACEditor
          mode="sh"
          width="464px"
          height="220px"/>
      </Form.Item>
    </Form>
  )
}

export default observer(Build)