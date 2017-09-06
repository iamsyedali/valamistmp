package com.arcusys.learn.liferay.util

import com.liferay.portal.kernel.service.permission.PortletPermissionUtil

object PortletPermissionUtilHelper {
  def getPrimaryKey(plid: Long, portletId: String): String =
    PortletPermissionUtil.getPrimaryKey(plid, portletId)
}
